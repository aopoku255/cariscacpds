import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, apiAsUser } from '@/lib/auth/session';
import type { Registration } from '@/lib/api/types';
import { Badge, Card, EmptyState, ButtonLink, Callout } from '@/components/ui';
import {
  eventDateRange, money, registrationStatusLabel, registrationTone,
  attendanceLabel, relativeDeadline,
} from '@/lib/format';
import { logoutAction } from '@/lib/auth/actions';
import styles from './dashboard.module.css';

export const metadata: Metadata = { title: 'My account', robots: { index: false } };
export const dynamic = 'force-dynamic';

const LIVE = ['CONFIRMED', 'PENDING_PAYMENT', 'WAITLISTED', 'REQUIRES_REVIEW'];

function RegistrationRow({ registration }: { registration: Registration }) {
  const event = registration.event;
  const needsPayment = registration.status === 'PENDING_PAYMENT';
  const deadline = relativeDeadline(registration.holdExpiresAt);

  return (
    <li className={styles.regRow}>
      <div className={styles.regMain}>
        <div className={styles.regHead}>
          <Badge tone={registrationTone[registration.status]}>
            {registrationStatusLabel[registration.status]}
          </Badge>
          <span className={styles.reference}>{registration.reference}</span>
        </div>

        <h3 className={styles.regTitle}>
          <Link href={`/dashboard/registrations/${registration.reference}`}>
            {event?.title ?? 'Event'}
          </Link>
        </h3>

        {event && (
          <p className={styles.regMeta}>
            {eventDateRange(event.startAt, event.endAt, event.timezone)}
            {' · '}{attendanceLabel[registration.attendanceMode]}
          </p>
        )}

        {needsPayment && deadline && deadline !== 'expired' && (
          <p className={styles.regUrgent}>
            Pay within {deadline} to keep your place
            {registration.amount ? ` · ${money(registration.amount)}` : ''}
          </p>
        )}
      </div>

      <div className={styles.regAction}>
        {needsPayment ? (
          <ButtonLink href={`/dashboard/registrations/${registration.reference}`} size="sm">
            Complete payment
          </ButtonLink>
        ) : (
          <Link href={`/dashboard/registrations/${registration.reference}`} className={styles.regLink}>
            View<span aria-hidden="true"> →</span>
          </Link>
        )}
      </div>
    </li>
  );
}

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect('/login?next=/dashboard');

  let registrations: Registration[] = [];
  let loadFailed = false;
  try {
    const { data } = await apiAsUser<Registration[]>('/registrations/mine');
    registrations = data ?? [];
  } catch {
    loadFailed = true;
  }

  const now = Date.now();
  const upcoming = registrations.filter((r) =>
    LIVE.includes(r.status) && r.event && new Date(r.event.endAt).getTime() >= now);
  const past = registrations.filter((r) =>
    r.event && new Date(r.event.endAt).getTime() < now);
  const other = registrations.filter((r) => !upcoming.includes(r) && !past.includes(r));

  const awaitingPayment = upcoming.filter((r) => r.status === 'PENDING_PAYMENT');

  return (
    <div className="shell">
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow}>My account</p>
            <h1 className={styles.title}>
              {user.firstName ? `Hello, ${user.firstName}` : 'Hello'}
            </h1>
          </div>
          <div className={styles.headActions}>
            <Link href="/dashboard/profile" className={styles.headLink}>My details</Link>
            <form action={logoutAction}>
              <button type="submit" className={styles.signOut}>Sign out</button>
            </form>
          </div>
        </header>

        {loadFailed && (
          <Callout tone="danger" title="We could not load your registrations">
            Something went wrong on our side. Please refresh in a moment.
          </Callout>
        )}

        {awaitingPayment.length > 0 && (
          <Callout tone="warning" title={
            awaitingPayment.length === 1
              ? 'One registration needs payment'
              : `${awaitingPayment.length} registrations need payment`
          }>
            Your place is held until you pay. Registration is not complete until payment
            is received.
          </Callout>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Coming up</h2>
          {upcoming.length > 0 ? (
            <ul className={styles.regList}>
              {upcoming.map((r) => <RegistrationRow key={r.id} registration={r} />)}
            </ul>
          ) : (
            <EmptyState
              title="Nothing booked yet"
              description="When you register for a CPD course, summit or forum it will appear here with your QR code."
              action={<ButtonLink href="/events">Browse events</ButtonLink>}
            />
          )}
        </section>

        {past.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Past events</h2>
            <ul className={styles.regList}>
              {past.map((r) => <RegistrationRow key={r.id} registration={r} />)}
            </ul>
          </section>
        )}

        {other.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cancelled</h2>
            <ul className={styles.regList}>
              {other.map((r) => <RegistrationRow key={r.id} registration={r} />)}
            </ul>
          </section>
        )}

        {/*
          Certificates get their own surface in Week 3. Saying so beats an
          empty box a participant cannot explain.
        */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Certificates</h2>
          <Card>
            <p className={styles.pending}>
              Certificates appear here once an event has finished and your attendance
              is confirmed. You will get an email when yours is ready.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
