import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { apiRequestOrNull } from '@/lib/api/client';
import { getSession, apiAsUser } from '@/lib/auth/session';
import type { PublicEvent, Quote } from '@/lib/api/types';
import { Callout, ButtonLink } from '@/components/ui';
import { eventDateRange } from '@/lib/format';
import { RegisterForm } from './RegisterForm';
import styles from './register.module.css';

export const metadata: Metadata = { title: 'Register', robots: { index: false } };

// Never cached: capacity and the participant's own quote change per request.
export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export default async function RegisterPage({ params }: { params: Params }) {
  const { slug } = await params;

  const event = await apiRequestOrNull<PublicEvent>(`/events/${encodeURIComponent(slug)}`);
  if (!event) notFound();

  const user = await getSession();
  if (!user) {
    // Come back here after signing in rather than dumping them on the dashboard.
    redirect(`/login?next=${encodeURIComponent(`/events/${slug}/register`)}`);
  }

  if (event.status === 'CANCELLED') {
    return (
      <div className="shell shell--narrow">
        <div className={styles.page}>
          <Callout tone="danger" title="This event has been cancelled">
            <p>Registration is closed. If you had already paid, a refund is on its way.</p>
            <p><Link href="/events">Browse other events</Link></p>
          </Callout>
        </div>
      </div>
    );
  }

  if (event.status !== 'REGISTRATION_OPEN') {
    return (
      <div className="shell shell--narrow">
        <div className={styles.page}>
          <Callout tone="info" title="Registration is not open">
            <p>
              {event.status === 'REGISTRATION_CLOSED'
                ? 'Registration for this event has closed.'
                : 'Registration for this event has not opened yet.'}
            </p>
          </Callout>
          <ButtonLink href={`/events/${event.slug}`} variant="secondary">
            Back to the event
          </ButtonLink>
        </div>
      </div>
    );
  }

  /**
   * Quote both ways up front so the radio buttons can show a real price
   * immediately. The quote endpoint holds nothing and creates nothing.
   */
  const modes = (['IN_PERSON', 'VIRTUAL'] as const).filter((m) => (
    m === 'IN_PERSON' ? event.deliveryMode !== 'ONLINE' : event.deliveryMode !== 'OFFLINE'
  ));

  const quotes: Partial<Record<'IN_PERSON' | 'VIRTUAL', Quote>> = {};
  await Promise.all(modes.map(async (m) => {
    try {
      const { data } = await apiAsUser<Quote>('/registrations/quote', {
        query: { eventId: event.id, attendanceMode: m },
      });
      quotes[m] = data;
    } catch {
      // A missing quote is not fatal — the server prices it again on submit,
      // and that is the figure that counts.
    }
  }));

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <Link href={`/events/${event.slug}`} className={styles.back}>
            <span aria-hidden="true">← </span>{event.title}
          </Link>
          <h1 className={styles.title}>Register</h1>
          <p className={styles.when}>
            {eventDateRange(event.startAt, event.endAt, event.timezone)}
          </p>
        </header>

        <RegisterForm event={event} user={user} quotes={quotes} />
      </div>
    </div>
  );
}
