'use client';

import { useActionState } from 'react';
import { Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { verifyEmailAction } from '@/lib/auth/actions';
import { emptyState } from '@/lib/auth/form-state';
import styles from '../auth.module.css';

/**
 * A button rather than confirming on page load: mail scanners open links
 * automatically, and that would spend the token before the person ever did.
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(verifyEmailAction, emptyState);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="token" value={token} />

      {state.message && (
        <Callout tone="danger" title="We could not confirm your email">{state.message}</Callout>
      )}

      <p>Press the button to confirm this email address for your CARISCA account.</p>

      <SubmitButton fullWidth size="lg" pendingLabel="Confirming…">Confirm my email</SubmitButton>
    </form>
  );
}
