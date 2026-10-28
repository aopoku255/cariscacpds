'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Callout, Field, inputClass } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { resetPasswordAction } from '@/lib/auth/actions';
import { emptyState } from '@/lib/auth/form-state';
import styles from '../auth.module.css';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, emptyState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="token" value={token} />

      {state.message && (
        <Callout tone="danger" title="We could not change your password">
          {state.message} <Link href="/forgot-password">Request a new link</Link>.
        </Callout>
      )}

      <Field label="New password" htmlFor="password" error={state.fieldErrors?.password}
        hint="At least 10 characters." required>
        <input id="password" name="password" type="password" autoComplete="new-password"
          className={inputClass} minLength={10} required autoFocus />
      </Field>

      <SubmitButton fullWidth size="lg" pendingLabel="Saving…">Change password</SubmitButton>
    </form>
  );
}
