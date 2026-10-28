'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Callout, Field, inputClass } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { forgotPasswordAction } from '@/lib/auth/actions';
import { emptyState } from '@/lib/auth/form-state';
import styles from '../auth.module.css';

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, emptyState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.ok && state.message && <Callout tone="success">{state.message}</Callout>}

      <Field label="Email address" htmlFor="email" error={state.fieldErrors?.email} required>
        <input id="email" name="email" type="email" autoComplete="email"
          className={inputClass} required autoFocus />
      </Field>

      <SubmitButton fullWidth size="lg" pendingLabel="Sending…">Send reset link</SubmitButton>

      <div className={styles.links}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </form>
  );
}
