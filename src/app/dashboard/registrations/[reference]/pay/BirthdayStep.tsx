'use client';

import { useActionState, useEffect } from 'react';
import { Field, Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import { submitBirthdayAction } from './actions';
import { emptyPayState, type PayState } from './state';

/** Nigeria's "Pay with Bank" can ask for a date of birth as an authentication step, in either order relative to an OTP. */
export function BirthdayStep({
  reference, paymentReference, hint, onAdvance,
}: {
  reference: string;
  paymentReference: string;
  hint?: string;
  onAdvance: (state: PayState) => void;
}) {
  const [state, formAction] = useActionState(submitBirthdayAction, emptyPayState);

  useEffect(() => {
    if (state !== emptyPayState && state.step !== 'birthday') onAdvance(state);
  }, [state, onAdvance]);

  return (
    <form action={formAction} className={formStyles.form}>
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="paymentReference" value={paymentReference} />

      {hint && <p>{hint}</p>}
      {state.message && !state.ok && (
        <Callout tone="danger" title="That did not work">{state.message}</Callout>
      )}

      <Field label="Date of birth" htmlFor="birthday" required error={state.fieldErrors?.birthday}>
        <input
          id="birthday" name="birthday" type="date" autoComplete="bday"
          className={formStyles.input} required
        />
      </Field>

      <SubmitButton pendingLabel="Confirming…" fullWidth>Confirm</SubmitButton>
    </form>
  );
}
