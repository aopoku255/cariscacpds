import Link from 'next/link';
import type { PublicEvent } from '@/lib/api/types';
import { Badge } from '@/components/ui';
import {
  eventDateRange, deliveryLabel, money, eventStatusLabel,
} from '@/lib/format';
import styles from './EventCard.module.css';

/**
 * Shows the cheapest available price rather than a range. Someone scanning a
 * list wants to know whether this is affordable, not to parse a matrix — the
 * full breakdown is on the event page.
 */
function fromPrice(event: PublicEvent) {
  if (!event.prices?.length) return null;
  const cheapest = [...event.prices].sort((a, b) => a.money.amountMinor - b.money.amountMinor)[0];
  if (cheapest.money.amountMinor === 0) return 'Free';
  const varies = event.prices.some((p) => p.money.amountMinor !== cheapest.money.amountMinor);
  return `${varies ? 'From ' : ''}${money(cheapest.money)}`;
}

export function EventCard({ event }: { event: PublicEvent }) {
  const price = fromPrice(event);
  const isOpen = event.status === 'REGISTRATION_OPEN';
  const bothFull = event.availability
    && event.availability.inPerson?.isFull !== false
    && event.availability.virtual?.isFull !== false;

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        {event.type && <Badge tone="accent">{event.type.name}</Badge>}
        {isOpen && !bothFull && <Badge tone="success">Open</Badge>}
        {bothFull && <Badge tone="warning">Full</Badge>}
        {event.status === 'CANCELLED' && <Badge tone="danger">Cancelled</Badge>}
        {!isOpen && event.status !== 'CANCELLED' && (
          <Badge tone="neutral">{eventStatusLabel[event.status] ?? event.status}</Badge>
        )}
      </div>

      <h3 className={styles.title}>
        <Link href={`/events/${event.slug}`}>{event.title}</Link>
      </h3>

      {event.shortDescription && <p className={styles.summary}>{event.shortDescription}</p>}

      <dl className={styles.meta}>
        <div>
          <dt>When</dt>
          <dd>{eventDateRange(event.startAt, event.endAt, event.timezone)}</dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>
            {deliveryLabel[event.deliveryMode]}
            {event.location.city ? ` · ${event.location.city}` : ''}
            {event.location.country ? `, ${event.location.country}` : ''}
          </dd>
        </div>
        {price && (
          <div>
            <dt>Fee</dt>
            <dd>{price}</dd>
          </div>
        )}
        {event.cpd?.credits ? (
          <div>
            <dt>CPD credits</dt>
            <dd>{event.cpd.credits}</dd>
          </div>
        ) : null}
      </dl>

      <Link className={styles.more} href={`/events/${event.slug}`}>
        View details<span aria-hidden="true"> →</span>
        <span className="visually-hidden"> for {event.title}</span>
      </Link>
    </article>
  );
}
