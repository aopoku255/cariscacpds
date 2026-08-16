'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './RouteProgress.module.css';

/**
 * The thin loading bar under the header.
 *
 * The App Router exposes no router events, so the two ends of a navigation are
 * observed separately: the start from the click that causes it, the finish from
 * the rendered route actually changing. That is why the click handler has to be
 * careful about which clicks it treats as navigations — a bar that starts and
 * never finishes is worse than no bar.
 *
 * The creep eases toward 90% and stops there. A server render takes as long as
 * it takes, and a bar that reaches 100% before the page arrives is a lie the
 * reader will notice the second time it happens.
 */

/**
 * Grace period before the bar appears at all. A prefetched route can render in
 * a few milliseconds, and a bar that flashes on and off is read as a glitch
 * rather than as progress.
 */
const SHOW_AFTER_MS = 120;
/** How often the bar advances while waiting. */
const CREEP_MS = 180;
/** How long the filled bar lingers before fading out. */
const SETTLE_MS = 240;

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const appear = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creep = useRef<ReturnType<typeof setInterval> | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  // Mirrors `progress` so finish() can tell synchronously whether the bar ever
  // became visible — state would still read 0 on the same tick.
  const shown = useRef(false);
  // The finish effect also runs on mount, when nothing is in flight.
  const mounted = useRef(false);

  const clearTimers = useCallback(() => {
    if (appear.current) { clearTimeout(appear.current); appear.current = null; }
    if (creep.current) { clearInterval(creep.current); creep.current = null; }
    if (settle.current) { clearTimeout(settle.current); settle.current = null; }
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    clearTimers();
    setDone(false);

    appear.current = setTimeout(() => {
      shown.current = true;
      setProgress(10);

      creep.current = setInterval(() => {
        // Asymptotic: each tick closes a fraction of the remaining gap, so it
        // slows as it goes and never claims to be finished.
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.12));
      }, CREEP_MS);
    }, SHOW_AFTER_MS);
  }, [clearTimers]);

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clearTimers();

    // The route landed inside the grace period — the bar never appeared, so
    // there is nothing to animate to completion.
    if (!shown.current) {
      setProgress(0);
      return;
    }

    shown.current = false;
    setProgress(100);
    setDone(true);
    settle.current = setTimeout(() => {
      setProgress(0);
      setDone(false);
    }, SETTLE_MS);
  }, [clearTimers]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Anything the browser will not handle as an in-page navigation: a
      // middle/right click, a modified click (new tab), or a click something
      // else has already claimed.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || !anchor.hasAttribute('href')) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;

      const url = new URL(anchor.href, window.location.href);
      // External links leave the app; the browser shows its own progress.
      if (url.origin !== window.location.origin) return;
      // A pure hash change, or a link back to where we already are, renders
      // nothing — the finish would never come.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    };

    // Capture phase, so the bar starts even where a handler stops propagation.
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', start);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', start);
      clearTimers();
    };
  }, [start, clearTimers]);

  // The route has actually changed — whatever was in flight has landed.
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    finish();
  }, [pathname, searchParams, finish]);

  if (progress === 0) return null;

  return (
    // Decorative: the page changing under the reader is the real feedback, and
    // announcing a percentage on every navigation would be noise.
    <div className={styles.track} aria-hidden="true">
      <div
        className={`${styles.bar} ${done ? styles.done : ''}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
