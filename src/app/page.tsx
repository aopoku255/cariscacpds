import Link from 'next/link';
import { apiRequest } from '@/lib/api/client';
import type { PublicEvent } from '@/lib/api/types';
import { EventCard } from '@/components/EventCard';
import { ButtonLink } from '@/components/ui';
import styles from './home.module.css';

export const revalidate = 60;

export default async function HomePage() {
  let events: PublicEvent[] = [];
  try {
    const result = await apiRequest<PublicEvent[]>('/events', {
      query: { when: 'upcoming', limit: 3 },
      revalidate: 60,
    });
    events = result.data ?? [];
  } catch {
    events = [];
  }

  return (
    <>
      <section className={styles.hero}>
        <div className="shell">
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>
              Centre for Applied Research and Innovation in Supply Chain&#8209;Africa
            </p>
            <h1 className={styles.title}>
              Build supply chain capability that lasts
            </h1>
            <p className={styles.lede}>
              CARISCA’s key objective is to support higher education institutions in
              building the capacity necessary to provide best-in-class degree programs and
              training, facilitate research translation and utilization, and engage
              stakeholders in best practices and policy changes that strengthen supply chains.
            </p>
            <div className={styles.actions}>
              <ButtonLink href="/events" size="lg">Browse events</ButtonLink>
              <ButtonLink href="/verify" size="lg" variant="secondary">
                Verify a certificate
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className={`shell ${styles.upcoming}`}>
        <div className={styles.sectionHead}>
          <h2>Coming up</h2>
          <Link href="/events" className={styles.seeAll}>
            All events<span aria-hidden="true"> →</span>
          </Link>
        </div>

        {events.length > 0 ? (
          <ul className={styles.grid}>
            {events.map((event) => (
              <li key={event.id}><EventCard event={event} /></li>
            ))}
          </ul>
        ) : (
          <p className={styles.none}>
            No events are scheduled at the moment. New programmes are announced
            regularly. <Link href="/events?when=past">See what we have run before</Link>.
          </p>
        )}
      </section>

      <section className={`shell ${styles.strands}`}>
        <h2 className={styles.strandsTitle}>What we run</h2>
        <ul className={styles.strandList}>
          <li>
            <h3>Continuing Professional Development</h3>
            <p>
              Short, practical courses on supply chain analytics, procurement and
              operations. Most award CPD credits and a verifiable certificate.
            </p>
          </li>
          <li>
            <h3>CARISCA Summit</h3>
            <p>
              The annual gathering of supply chain researchers and practitioners working
              on African markets.
            </p>
          </li>
          <li>
            <h3>Business Forum</h3>
            <p>
              Where industry and research meet to work through the problems facing supply
              chains on the continent.
            </p>
          </li>
        </ul>
      </section>
    </>
  );
}
