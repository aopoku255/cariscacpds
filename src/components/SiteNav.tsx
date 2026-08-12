'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SiteNav.module.css';

/**
 * Site navigation.
 *
 * One list, rendered inline on desktop and behind a toggle on phones. A
 * hamburger rather than a bottom bar: there are three or four destinations and
 * a fixed bottom bar would sit on top of the page's own actions — the register
 * button, the payment prompt — which are what people are actually here for.
 */

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  emphasis?: boolean;
}

export function SiteNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Navigating should never leave the menu hanging open over the new page.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const item = (link: NavLink) => {
    const active = !link.external && (
      link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
    );
    const className = [
      styles.link,
      link.emphasis ? styles.emphasis : '',
      active ? styles.active : '',
    ].filter(Boolean).join(' ');

    if (link.external) {
      return (
        <a key={link.href} href={link.href} className={className}>{link.label}</a>
      );
    }
    return (
      <Link key={link.href} href={link.href} className={className}
        aria-current={active ? 'page' : undefined}>
        {link.label}
      </Link>
    );
  };

  return (
    <>
      <nav className={styles.desktop} aria-label="Main">
        {links.map(item)}
      </nav>

      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.bars} aria-hidden="true">
          <span className={open ? styles.barTopOpen : styles.bar} />
          <span className={open ? styles.barMidOpen : styles.bar} />
          <span className={open ? styles.barBottomOpen : styles.bar} />
        </span>
        {open ? 'Close' : 'Menu'}
      </button>

      {/*
        Kept in the DOM and hidden with an attribute rather than unmounted, so
        the toggle's aria-controls always points at something real.
      */}
      <div
        id="site-menu"
        ref={panelRef}
        className={styles.panel}
        data-open={open}
        hidden={!open}
      >
        <nav aria-label="Main, mobile">
          {links.map(item)}
        </nav>
      </div>
    </>
  );
}
