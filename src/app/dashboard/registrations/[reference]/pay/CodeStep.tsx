'use client';

import { useActionState, useEffect } from 'react';
import { Field, Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import { submitOtpAction, submitPinAction } from './actions';
import { emptyPayState, type PayState } from './state';

/**
 * One form, reused for both the OTP and the PIN step — Paystack's own
 * response says which is needed (sometimes both, in sequence), so the
 * parent just tells this component which one to render right now.
 */
export function CodeStep({
  reference, paymentReference, kind, hint, onAdvance,
}: {
  reference: string;
  paymentReference: string;
  kind: 'otp' | 'pin';
  hint?: string;
  onAdvance: (state: PayState) => void;
}) {
  const action = kind === 'otp' ? submitOtpAction : submitPinAction;
  const [state, formAction] = useActionState(action, emptyPayState);

  useEffect(() => {
    // Guarded by reference identity against the shared `emptyPayState`
    // constant, so this only fires once the action has actually run — not
    // on mount, where `state.step` (the initial 'phone') would otherwise
    // never equal `kind` and fire immediately with nothing to advance to.
    if (state !== emptyPayState && state.step !== kind) onAdvance(state);
  }, [state, kind, onAdvance]);

  const label = kind === 'otp' ? 'One-time code' : 'Mobile money PIN';

  return (
    <form action={formAction} className={formStyles.form}>
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="paymentReference" value={paymentReference} />

      {hint && <p>{hint}</p>}
      {state.message && !state.ok && (
        <Callout tone="danger" title="That did not work">{state.message}</Callout>
      )}

      <Field label={label} htmlFor={kind} required error={state.fieldErrors?.[kind]}>
        <input
          id={kind} name={kind} type={kind === 'pin' ? 'password' : 'text'}
          inputMode="numeric" autoComplete="one-time-code" className={formStyles.input} required
        />
      </Field>

      <SubmitButton pendingLabel="Confirming…" fullWidth>Confirm</SubmitButton>
    </form>
  );
}
