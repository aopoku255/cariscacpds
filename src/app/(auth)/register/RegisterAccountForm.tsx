'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Callout, Field, inputClass, selectClass } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { registerAction } from '@/lib/auth/actions';
import { emptyState } from '@/lib/auth/form-state';
import type { ReferenceData } from '@/lib/api/types';
import styles from '../auth.module.css';

/**
 * Account creation asks for the minimum: a name, an email and a password.
 *
 * Everything else — position, sector, city, phone — is collected on the
 * profile once, or at the point it is actually needed. Front-loading fourteen
 * questions before someone has an account is how registration funnels die.
 */
export function RegisterAccountForm({
  next, countries,
}: { next: string; countries: ReferenceData['countries'] }) {
  const [state, formAction] = useActionState(registerAction, emptyState);

  if (state.ok && state.message) {
    return (
      <Callout tone="success" title="Almost there">
        {state.message} You can close this page.
      </Callout>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="next" value={next} />

      {state.message && (
        <Callout tone="danger" title="We could not create your account">{state.message}</Callout>
      )}

      <div className={styles.pair}>
        <Field label="First name" htmlFor="firstName" error={state.fieldErrors?.firstName} required>
          <input id="firstName" name="firstName" className={inputClass}
            autoComplete="given-name" required autoFocus />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={state.fieldErrors?.lastName} required>
          <input id="lastName" name="lastName" className={inputClass}
            autoComplete="family-name" required />
        </Field>
      </div>

      <Field label="Email address" htmlFor="email" error={state.fieldErrors?.email} required
        hint="We send your confirmation, QR code and certificate here.">
        <input id="email" name="email" type="email" className={inputClass}
          autoComplete="email" required />
      </Field>

      <Field label="Password" htmlFor="password" error={state.fieldErrors?.password} required
        hint="At least 10 characters.">
        <input id="password" name="password" type="password" className={inputClass}
          autoComplete="new-password" minLength={10} required />
      </Field>

      <Field label="Organization" htmlFor="organization" hint="Optional — you can add this later.">
        <input id="organization" name="organization" className={inputClass}
          autoComplete="organization" />
      </Field>

      <Field label="Country" htmlFor="countryCode" error={state.fieldErrors?.countryCode}
        hint="This affects the fee you are quoted for some events.">
        <select id="countryCode" name="countryCode" className={selectClass} defaultValue="">
          <option value="">Please choose…</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </Field>

      <SubmitButton fullWidth size="lg" pendingLabel="Creating your account…">
        Create account
      </SubmitButton>

      <div className={styles.links}>
        <span>Already have an account?</span>
        <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
      </div>
    </form>
  );
}
