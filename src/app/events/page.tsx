import type { Metadata } from 'next';
import Link from 'next/link';
import { apiRequest } from '@/lib/api/client';
import type { PublicEvent, PageMeta } from '@/lib/api/types';
import { EventCard } from '@/components/EventCard';
import { EmptyState, ButtonLink } from '@/components/ui';
import styles from './events.module.css';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Continuing professional development, summits and business forums from CARISCA at KNUST.',
};

// Time-based revalidation (`revalidate: N`) doesn't reliably refresh in this
// app's `output: standalone` Docker deployment — a newly published event was
// found stuck out of the listing indefinitely, well past its 60s window,
// until the container was recreated. Always fetching fresh costs a little
// latency per request; a listing an admin just changed silently not
// reflecting it is worse.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ when?: string; q?: string; page?: string }>;

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past events' },
] as const;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const when = params.when === 'past' ? 'past' : 'upcoming';
  const page = Number(params.page ?? '1') || 1;

  let events: PublicEvent[] = [];
  let meta: PageMeta | undefined;
  let failed = false;

  try {
    const result = await apiRequest<PublicEvent[]>('/events', {
      query: { when, q: params.q, page, limit: 12 },
    });
    events = result.data ?? [];
    meta = result.meta;
  } catch {
    // The API being down should not blank the page — say so plainly.
    failed = true;
  }

  return (
    <div className="shell">
      <header className={styles.head}>
        <p className={styles.eyebrow}>CARISCA</p>
        <h1 className={styles.title}>Events and professional development</h1>
        <p className={styles.lede}>
          Short courses, summits and forums for supply chain practitioners, researchers
          and students across Africa and beyond.
        </p>
      </header>

      <nav className={styles.tabs} aria-label="Filter events">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/events?when=${tab.key}`}
            className={when === tab.key ? styles.tabActive : styles.tab}
            aria-current={when === tab.key ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {failed && (
        <EmptyState
          title="We cannot load events right now"
          description="Something went wrong on our side. Please try again in a moment."
          action={<ButtonLink href="/events">Try again</ButtonLink>}
        />
      )}

      {!failed && events.length === 0 && (
        <EmptyState
          title={when === 'past' ? 'No past events yet' : 'No events scheduled just now'}
          description={
            when === 'past'
              ? 'Once an event has finished it will be listed here.'
              : 'New programmes are announced regularly. Check back soon, or browse what we have run before.'
          }
          action={
            <ButtonLink href={`/events?when=${when === 'past' ? 'upcoming' : 'past'}`} variant="secondary">
              {when === 'past' ? 'See upcoming events' : 'Browse past events'}
            </ButtonLink>
          }
        />
      )}

      {events.length > 0 && (
        <>
          <ul className={styles.grid}>
            {events.map((event) => (
              <li key={event.id}><EventCard event={event} /></li>
            ))}
          </ul>

          {meta && meta.totalPages > 1 && (
            <nav className={styles.pager} aria-label="Pagination">
              {meta.hasPrevious && (
                <ButtonLink variant="secondary" size="sm"
                  href={`/events?when=${when}&page=${meta.page - 1}`}>
                  ← Previous
                </ButtonLink>
              )}
              <span className={styles.pagerCount}>Page {meta.page} of {meta.totalPages}</span>
              {meta.hasNext && (
                <ButtonLink variant="secondary" size="sm"
                  href={`/events?when=${when}&page=${meta.page + 1}`}>
                  Next →
                </ButtonLink>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
