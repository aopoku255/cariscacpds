import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, apiAsUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/client';
import type { Registration } from '@/lib/api/types';
import { Badge, Card, Callout, ButtonLink } from '@/components/ui';
import uiStyles from '@/components/ui/ui.module.css';
import {
  eventDateRange, eventTime, timezoneLabel, money, relativeDeadline,
  registrationStatusLabel, registrationTone, attendanceLabel,
} from '@/lib/format';
import styles from './registration.module.css';

export const metadata: Metadata = { title: 'Your registration', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Params = Promise<{ reference: string }>;
type SearchParams = Promise<{ new?: string; certificateError?: string }>;

export default async function RegistrationPage({
  params, searchParams,
}: { params: Params; searchParams: SearchParams }) {
  const { reference } = await params;
  const { new: isNew, certificateError } = await searchParams;

  const user = await getSession();
  if (!user) redirect(`/login?next=/dashboard/registrations/${reference}`);

  let registration: Registration;
  try {
    const { data } = await apiAsUser<Registration>(`/registrations/${encodeURIComponent(reference)}`);
    registration = data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  const event = registration.event;
  const needsPayment = registration.status === 'PENDING_PAYMENT';
  const deadline = relativeDeadline(registration.holdExpiresAt);
  const expired = deadline === 'expired';

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <Link href="/dashboard" className={styles.back}>
          <span aria-hidden="true">← </span>My account
        </Link>

        {isNew && registration.status === 'CONFIRMED' && (
          <Callout tone="success" title="You are registered">
            We have emailed your confirmation. Your QR code is below. Bring it with you.
          </Callout>
        )}

        {isNew && registration.status === 'WAITLISTED' && (
          <Callout tone="info" title="You are on the waitlist">
            This event is full. We will email you if a place opens up. Nothing to pay for now.
          </Callout>
        )}

        <header className={styles.head}>
          <div className={styles.headRow}>
            <Badge tone={registrationTone[registration.status]}>
              {registrationStatusLabel[registration.status]}
            </Badge>
            <span className={styles.reference}>{registration.reference}</span>
          </div>
          <h1 className={styles.title}>{event?.title ?? 'Your registration'}</h1>
        </header>

        {needsPayment && (
          <Card className={styles.payCard}>
            <h2 className={styles.payTitle}>
              {expired ? 'Your hold has expired' : 'Payment needed'}
            </h2>

            {expired ? (
              <p className={styles.payText}>
                We did not receive payment in time, so your place may have been released.
                Try registering again. If places remain you can still join.
              </p>
            ) : (
              <>
                <p className={styles.payText}>
                  Your registration is not complete until payment is received. We are
                  holding your place for another <strong>{deadline}</strong>.
                </p>
                <div className={styles.payAmount}>
                  <span>Amount due</span>
                  <strong>{money(registration.amount)}</strong>
                </div>
              </>
            )}

            {/*
              Payment providers land in Week 2. Showing a dead "Pay now" button
              would be worse than saying plainly where things stand.
            */}
            <Callout tone="warning" title="Online payment is not switched on yet">
              Card and mobile money payment goes live shortly. In the meantime the
              CARISCA team will contact you with payment instructions, or email{' '}
              <a href="mailto:info@carisca.knust.edu.gh">info@carisca.knust.edu.gh</a>.
            </Callout>
          </Card>
        )}

        {event && (
          <Card>
            <h2 className={styles.cardTitle}>Event details</h2>
            <dl className={styles.details}>
              <div>
                <dt>When</dt>
                <dd>
                  {eventDateRange(event.startAt, event.endAt, event.timezone)}
                  <span className={styles.subtle}>
                    {' '}{eventTime(event.startAt, event.timezone)}–{eventTime(event.endAt, event.timezone)}
                    {' '}{timezoneLabel(event.startAt, event.timezone)}
                  </span>
                </dd>
              </div>
              <div><dt>Attending</dt><dd>{attendanceLabel[registration.attendanceMode]}</dd></div>
              {registration.amount && (
                <div>
                  <dt>Fee</dt>
                  <dd>
                    {registration.amount.amountMinor === 0 ? 'Free' : money(registration.amount)}
                    {registration.status === 'CONFIRMED' && registration.amount.amountMinor > 0 && ' · paid'}
                  </dd>
                </div>
              )}
              {event.onlineUrl && (
                <div>
                  <dt>Joining link</dt>
                  <dd><a href={event.onlineUrl}>{event.onlineUrl}</a></dd>
                </div>
              )}
            </dl>
            <p className={styles.eventLink}>
              <Link href={`/events/${event.slug}`}>See the full programme</Link>
            </p>
          </Card>
        )}

        {certificateError && (
          <Callout tone="warning" title="Could not generate your certificate">
            {certificateError}
          </Callout>
        )}

        {registration.certificate?.eligible && (
          <Card>
            <h2 className={styles.cardTitle}>Your certificate</h2>
            <p className={styles.subtle}>
              Download it as a PDF for printing, or an image to share.
            </p>
            {/*
              A plain anchor, not next/link: this URL is a Route Handler
              that streams a file, not a page, and Next's client-side router
              would otherwise try to soft-navigate to it as one.
            */}
            <div className={styles.footerActions}>
              <a href={`/dashboard/registrations/${reference}/certificate?format=pdf`}
                className={`${uiStyles.button} ${uiStyles['v-primary']} ${uiStyles['s-md']}`}>
                Download PDF
              </a>
              <a href={`/dashboard/registrations/${reference}/certificate?format=png`}
                className={`${uiStyles.button} ${uiStyles['v-secondary']} ${uiStyles['s-md']}`}>
                Download image
              </a>
            </div>
          </Card>
        )}

        {registration.status === 'CONFIRMED' && (
          <Card>
            <h2 className={styles.cardTitle}>Your check-in code</h2>
            {/*
              Rendered as the reference for now; the scanner and QR image ship
              in Week 3 with attendance. Staff can already find someone by
              reference at the door.
            */}
            <p className={styles.qrPlaceholder}>{registration.reference}</p>
            <p className={styles.subtle}>
              Show this at the door. Your scannable QR code will appear here before
              the event, and we will email it to you too.
            </p>
          </Card>
        )}

        {registration.answers && registration.answers.length > 0 && (
          <Card>
            <h2 className={styles.cardTitle}>What you told us</h2>
            <dl className={styles.details}>
              {registration.answers.map((a) => (
                <div key={a.questionId}>
                  <dt>{a.label}</dt>
                  <dd>{a.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {registration.status === 'CANCELLED' && (
          <Callout tone="neutral" title="This registration was cancelled">
            {registration.cancellationReason ?? 'No reason was recorded.'}
            {event && (
              <> <Link href={`/events/${event.slug}`}>You can register again</Link> if places remain.</>
            )}
          </Callout>
        )}

        {['CONFIRMED', 'PENDING_PAYMENT', 'WAITLISTED'].includes(registration.status) && (
          <div className={styles.footerActions}>
            <ButtonLink href="/dashboard" variant="secondary">Back to my account</ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
