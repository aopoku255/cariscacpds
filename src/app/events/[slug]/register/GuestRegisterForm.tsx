'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import type { PublicEvent, ReferenceData } from '@/lib/api/types';
import {
  Callout, Field, Card, inputClass, selectClass, textareaClass, checkRowClass,
} from '@/components/ui';
import { QuestionField } from '@/components/forms/QuestionField';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { attendanceLabel } from '@/lib/format';
import { registerGuestAction } from './actions';
import { emptyRegisterState } from './state';
import styles from './register.module.css';

/**
 * Registering without an account first.
 *
 * The same event-specific questions as RegisterForm, plus the profile
 * fields a certificate needs — collected here instead of on a separate
 * profile page, since there is no account yet to hold them. The API creates
 * one from these fields and signs the participant straight into it, so this
 * is the only step, not the first of two.
 *
 * No live price quote: resolving one depends on the participant's country,
 * which this form is the first place that's known. The fee is confirmed the
 * moment they submit, same as when a quote fails to load for a signed-in
 * participant.
 */
export function GuestRegisterForm({
  event, reference,
}: {
  event: PublicEvent;
  reference: ReferenceData;
}) {
  const [state, formAction] = useActionState(registerGuestAction, emptyRegisterState);

  const modes = (['IN_PERSON', 'VIRTUAL'] as const).filter((m) => {
    if (m === 'IN_PERSON') return event.deliveryMode !== 'ONLINE';
    return event.deliveryMode !== 'OFFLINE';
  });

  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>(modes[0]);

  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="slug" value={event.slug} />

      {state.message && (
        <Callout tone={state.code === 'ALREADY_REGISTERED' || state.code === 'EMAIL_HAS_ACCOUNT' ? 'info' : 'danger'}
          title="We could not register you">
          {state.message}
          {(state.code === 'ALREADY_REGISTERED' || state.code === 'EMAIL_HAS_ACCOUNT') && (
            <>
              {' '}
              <Link href={`/login?next=${encodeURIComponent(`/events/${event.slug}/register`)}`}>
                Sign in
              </Link>.
            </>
          )}
        </Callout>
      )}

      <p className={styles.signInNote}>
        Already registered for a CARISCA event before?{' '}
        <Link href={`/login?next=${encodeURIComponent(`/events/${event.slug}/register`)}`}>
          Sign in
        </Link>{' '}
        instead — it only takes a moment and fills in your details for you.
      </p>

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
                <span><strong>{attendanceLabel[m]}</strong></span>
              </label>
            ))}
          </div>
        </section>
      )}
      {modes.length === 1 && <input type="hidden" name="attendanceMode" value={modes[0]} />}

      {/* --- your details --------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your details</h2>
        <p className={styles.sectionNote}>
          This creates your CARISCA account too, so you can come back and check on
          your registration later. Exactly as it should appear on your certificate.
        </p>

        <div className={styles.pair}>
          <Field label="First name" htmlFor="firstName" error={err('firstName')} required>
            <input id="firstName" name="firstName" className={inputClass}
              autoComplete="given-name" maxLength={80} required />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={err('lastName')} required>
            <input id="lastName" name="lastName" className={inputClass}
              autoComplete="family-name" maxLength={80} required />
          </Field>
        </div>

        <Field label="Email address" htmlFor="email" error={err('email')} required
          hint="Your confirmation, QR code and certificate go here.">
          <input id="email" name="email" type="email" className={inputClass}
            autoComplete="email" maxLength={255} required />
        </Field>

        <Field label="Phone" htmlFor="phone" error={err('phone')} required>
          <input id="phone" name="phone" type="tel" className={inputClass}
            autoComplete="tel" maxLength={32} required />
        </Field>

        <div className={styles.pair}>
          <Field label="Organization" htmlFor="organization" error={err('organization')} required>
            <input id="organization" name="organization" className={inputClass}
              autoComplete="organization" maxLength={160} required />
          </Field>
          <Field label="Job title" htmlFor="jobTitle" error={err('jobTitle')} required>
            <input id="jobTitle" name="jobTitle" className={inputClass}
              autoComplete="organization-title" maxLength={160} required />
          </Field>
        </div>

        <div className={styles.pair}>
          <Field label="Position" htmlFor="positionKey" error={err('positionKey')} required>
            <select id="positionKey" name="positionKey" className={selectClass} defaultValue="" required>
              <option value="" disabled>Select one</option>
              {reference.positions.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Sector" htmlFor="sectorKey" error={err('sectorKey')} required>
            <select id="sectorKey" name="sectorKey" className={selectClass} defaultValue="" required>
              <option value="" disabled>Select one</option>
              {reference.sectors.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Country" htmlFor="countryCode" error={err('countryCode')} required
          hint="Some events are priced differently by region, so this affects your fee.">
          <select id="countryCode" name="countryCode" className={selectClass} defaultValue="" required>
            <option value="" disabled>Select one</option>
            {reference.countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Password" htmlFor="password" error={err('password')}
          hint="Optional. Set one now to sign in later, or skip it — you can always set one with 'forgot password' using this email.">
          <input id="password" name="password" type="password" className={inputClass}
            autoComplete="new-password" minLength={10} maxLength={200} />
        </Field>
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

      <Card className={styles.quote}>
        <p className={styles.quoteNote}>
          If there is a fee for this event, your place is held while you pay — you will
          see the amount and how to pay it as soon as you submit this form.
        </p>
      </Card>

      <div className={styles.actions}>
        <SubmitButton size="lg" pendingLabel="Registering…">
          Register and continue
        </SubmitButton>
        <Link href={`/events/${event.slug}`} className={styles.cancel}>Back to the event</Link>
      </div>
    </form>
  );
}
