'use client';

import { useActionState } from 'react';
import { Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import { initiateCardPaymentAction } from './actions';
import { emptyPayState } from './state';

/**
 * A successful submission never reaches this component's render again — the
 * action redirects the browser straight to Paystack's checkout page. Only a
 * failure to even start the redirect shows anything here.
 */
export function CardPayForm({ reference }: { reference: string }) {
  const [state, formAction] = useActionState(initiateCardPaymentAction, emptyPayState);

  return (
    <form action={formAction} className={formStyles.form}>
      <input type="hidden" name="reference" value={reference} />

      {state.message && !state.ok && (
        <Callout tone="danger" title="Could not start payment">{state.message}</Callout>
      )}

      <SubmitButton pendingLabel="Redirecting to Paystack…" fullWidth>Pay with card</SubmitButton>
    </form>
  );
}
