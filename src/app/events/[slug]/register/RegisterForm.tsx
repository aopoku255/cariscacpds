'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import type { PublicEvent, SessionUser, Quote } from '@/lib/api/types';
import { Callout, Field, Card, inputClass, textareaClass, checkRowClass } from '@/components/ui';
import { QuestionField } from '@/components/forms/QuestionField';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { money, attendanceLabel } from '@/lib/format';
import { registerForEventAction } from './actions';
import { emptyRegisterState } from './state';
import styles from './register.module.css';

/**
 * The registration form.
 *
 * Everything the participant already told us is prefilled from their profile,
 * so a returning attendee mostly presses one button. The event's own questions
 * render underneath from configuration.
 */
export function RegisterForm({
  event, user, quotes,
}: {
  event: PublicEvent;
  user: SessionUser;
  quotes: Partial<Record<'IN_PERSON' | 'VIRTUAL', Quote>>;
}) {
  const [state, formAction] = useActionState(registerForEventAction, emptyRegisterState);

  const modes = (['IN_PERSON', 'VIRTUAL'] as const).filter((m) => {
    if (m === 'IN_PERSON') return event.deliveryMode !== 'ONLINE';
    return event.deliveryMode !== 'OFFLINE';
  });

  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>(modes[0]);
  const quote = quotes[mode];

  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="slug" value={event.slug} />

      {state.message && (
        <Callout tone={state.code === 'ALREADY_REGISTERED' ? 'info' : 'danger'} title="We could not register you">
          {state.message}
          {state.code === 'ALREADY_REGISTERED' && (
            <> <Link href="/dashboard">Go to my dashboard</Link>.</>
          )}
        </Callout>
      )}

      {/* --- how you will attend ------------------------------------------ */}
      {modes.length > 1 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How will you attend?</h2>
          <div className="stack stack-2">
            {modes.map((m) => (
              <label key={m} className={checkRowClass}>
                <input
                  type="radio"
                  name="attendanceMode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                />
                <span>
                  <strong>{attendanceLabel[m]}</strong>
                  {quotes[m] && (
                    <span className={styles.modePrice}>
                      {quotes[m]!.isFree ? 'Free' : money(quotes[m]!.amount)}
                      {quotes[m]!.isFull && ' · currently full'}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}
      {modes.length === 1 && <input type="hidden" name="attendanceMode" value={modes[0]} />}

      {/* --- what it costs -------------------------------------------------- */}
      {quote && (
        <Card className={styles.quote}>
          <div className={styles.quoteRow}>
            <span>{quote.label}</span>
            <strong className={styles.quoteAmount}>
              {quote.isFree ? 'Free' : money(quote.amount)}
            </strong>
          </div>
          {!quote.isFree && (
            <p className={styles.quoteNote}>
              Your place is held while you pay. Registration is only complete once
              payment is received.
            </p>
          )}
          {quote.isFull && quote.waitlistAvailable && (
            <p className={styles.quoteNote}>
              This option is full. You will be added to the waitlist and emailed if
              a place opens up. No payment is taken for a waitlist place.
            </p>
          )}
        </Card>
      )}

      {/* --- your details --------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your details</h2>
        <p className={styles.sectionNote}>
          Taken from your profile.{' '}
          <Link href={`/dashboard/profile?next=/events/${event.slug}/register`}>
            Update your details
          </Link>{' '}
          if anything is wrong, as they appear on your certificate.
        </p>

        <dl className={styles.summary}>
          <div><dt>Name</dt><dd>{user.displayName || user.fullName}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          {user.organization && <div><dt>Organization</dt><dd>{user.organization}</dd></div>}
          {user.countryCode && <div><dt>Country</dt><dd>{user.countryCode}</dd></div>}
        </dl>
      </section>

      {/* --- the event's own questions -------------------------------------- */}
      {event.questions && event.questions.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>A few questions</h2>
          <div className="stack stack-5">
            {event.questions.map((q) => (
              <QuestionField key={q.id} question={q} error={err(`q-${q.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* --- standard extras ------------------------------------------------ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Anything else</h2>
        <div className="stack stack-5">
          <Field label="Accessibility or dietary requirements" htmlFor="specialRequirements"
            hint="Tell us anything we need to arrange for you.">
            <textarea id="specialRequirements" name="specialRequirements"
              className={textareaClass} maxLength={1000} />
          </Field>

          <Field label="Comments or questions" htmlFor="comments" hint="Optional.">
            <textarea id="comments" name="comments" className={textareaClass} maxLength={5000} />
          </Field>

          {event.issuesCertificate && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Do you want a certificate of participation?</legend>
              <div className="stack stack-2">
                <label className={checkRowClass}>
                  <input type="radio" name="wantsCertificate" value="yes" defaultChecked />
                  <span>Yes</span>
                </label>
                <label className={checkRowClass}>
                  <input type="radio" name="wantsCertificate" value="no" />
                  <span>No</span>
                </label>
              </div>
            </fieldset>
          )}

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Have you attended a CARISCA event before?</legend>
            <div className="stack stack-2">
              <label className={checkRowClass}>
                <input type="radio" name="isPreviousAttendee" value="yes" />
                <span>Yes</span>
              </label>
              <label className={checkRowClass}>
                <input type="radio" name="isPreviousAttendee" value="no" defaultChecked />
                <span>No</span>
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      {/* --- consent -------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recording</h2>
        <label className={checkRowClass}>
          <input type="checkbox" name="mediaConsent" required
            aria-invalid={err('mediaConsent') ? true : undefined} />
          <span>
            I understand that sessions at this event will be recorded, and that photographs
            and video may be shared by CARISCA.
          </span>
        </label>
        {err('mediaConsent') && (
          <p className={styles.consentError} role="alert">{err('mediaConsent')}</p>
        )}
      </section>

      <div className={styles.actions}>
        <SubmitButton size="lg" pendingLabel="Registering…">
          {quote?.isFull && quote.waitlistAvailable
            ? 'Join the waitlist'
            : quote?.isFree ? 'Complete registration' : 'Register and continue to payment'}
        </SubmitButton>
        <Link href={`/events/${event.slug}`} className={styles.cancel}>Back to the event</Link>
      </div>
    </form>
  );
}
