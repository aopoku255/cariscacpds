'use client';

import { useState } from 'react';
import styles from './EventCard.module.css';

/**
 * An event's artwork, with the brand placeholder as its fallback.
 *
 * A client component purely for `onError`. A banner row can outlive the file
 * it points at — storage swapped, a file removed behind the record — and the
 * browser's own broken-image glyph is a far worse thing to show a visitor
 * than the placeholder every image-less event already gets.
 */
export function EventBanner({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Placeholder />;

  return (
    // Decorative: the card's title link already names the event.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={styles.banner}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function Placeholder() {
  return (
    <span className={styles.placeholder}>
      <span className={styles.placeholderMark}>CARISCA</span>
    </span>
  );
}
