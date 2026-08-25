import Link from 'next/link';
import type { PublicEvent } from '@/lib/api/types';
import { Badge } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/icons';
import { EventBanner, Placeholder } from './EventBanner';
import { assetUrl } from '@/lib/api/assets';
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

  const banner = assetUrl(event.banner?.url);

  const facts: { icon: IconName; label: string; value: string }[] = [
    {
      icon: 'calendar',
      label: 'When',
      value: eventDateRange(event.startAt, event.endAt, event.timezone),
    },
    {
      icon: 'pin',
      label: 'Where',
      value: `${deliveryLabel[event.deliveryMode]}${
        event.location.city ? ` · ${event.location.city}` : ''
      }${event.location.country ? `, ${event.location.country}` : ''}`,
    },
  ];
  if (price) facts.push({ icon: 'tag', label: 'Fee', value: price });
  if (event.cpd?.credits) {
    facts.push({ icon: 'award', label: 'CPD credits', value: String(event.cpd.credits) });
  }

  return (
    <article className={styles.card}>
      {/*
        Every card gets this block whether or not it has artwork. Cards in a
        grid are stretched to a common height, so when only some had a banner
        the rest padded the difference out as blank space above the link —
        the placeholder keeps all of them structurally identical instead.
      */}
      <Link
        href={`/events/${event.slug}`}
        className={styles.media}
        tabIndex={-1}
        aria-hidden="true"
      >
        {banner ? <EventBanner src={banner} /> : <Placeholder />}

        <span className={styles.badges}>
          {event.type && <Badge tone="accent">{event.type.name}</Badge>}
          {isOpen && !bothFull && <Badge tone="success">Open</Badge>}
          {bothFull && <Badge tone="warning">Full</Badge>}
          {event.status === 'CANCELLED' && <Badge tone="danger">Cancelled</Badge>}
          {!isOpen && event.status !== 'CANCELLED' && (
            <Badge tone="neutral">{eventStatusLabel[event.status] ?? event.status}</Badge>
          )}
        </span>
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h3>

        {event.shortDescription && <p className={styles.summary}>{event.shortDescription}</p>}

        <dl className={styles.meta}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt>
                <Icon name={fact.icon} className={styles.factIcon} />
                <span className="visually-hidden">{fact.label}</span>
              </dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <Link className={styles.more} href={`/events/${event.slug}`}>
          View details
          <Icon name="arrowRight" className={styles.moreIcon} />
          <span className="visually-hidden"> for {event.title}</span>
        </Link>
      </div>
    </article>
  );
}
