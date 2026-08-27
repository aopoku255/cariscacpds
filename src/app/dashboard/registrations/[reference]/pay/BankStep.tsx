'use client';

import { useActionState, useEffect } from 'react';
import { Field, Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import type { Bank } from '@/lib/api/types';
import { initiateBankAction } from './actions';
import { emptyPayState, type PayState } from './state';

/** Nigeria's "Pay with Bank" — the account is entered here, in our own form, never a redirect to Paystack. */
export function BankStep({
  reference, banks, onAdvance,
}: {
  reference: string;
  banks: Bank[];
  onAdvance: (state: PayState) => void;
}) {
  const [state, formAction] = useActionState(initiateBankAction, emptyPayState);

  useEffect(() => {
    if (state.ok) onAdvance(state);
  }, [state, onAdvance]);

  return (
    <form action={formAction} className={formStyles.form}>
      <input type="hidden" name="reference" value={reference} />

      {state.message && !state.ok && (
        <Callout tone="danger" title="Could not start payment">{state.message}</Callout>
      )}

      <Field label="Bank" htmlFor="bankCode" required>
        <select id="bankCode" name="bankCode" className={formStyles.input} defaultValue="" required>
          <option value="" disabled>Select your bank</option>
          {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
      </Field>

      <Field label="Account number" htmlFor="accountNumber" required error={state.fieldErrors?.accountNumber}>
        <input
          id="accountNumber" name="accountNumber" type="text" inputMode="numeric" autoComplete="off"
          className={formStyles.input} placeholder="0000000000" required
        />
      </Field>

      <SubmitButton pendingLabel="Starting payment…" fullWidth>Pay now</SubmitButton>
    </form>
  );
}
