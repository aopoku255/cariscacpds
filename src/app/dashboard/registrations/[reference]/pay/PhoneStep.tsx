'use client';

import { useActionState, useEffect } from 'react';
import { Field, Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import { initiateMobileMoneyAction } from './actions';
import { emptyPayState, type PayState } from './state';

/** Which mobile-money networks Paystack supports, per currency — matches `MOBILE_MONEY_PROVIDERS` in payment.service.js. */
const NETWORKS_BY_CURRENCY: Record<string, { value: string; label: string }[]> = {
  GHS: [
    { value: 'mtn', label: 'MTN Mobile Money' },
    { value: 'atl', label: 'AirtelTigo Money' },
    { value: 'vod', label: 'Vodafone Cash' },
  ],
  KES: [
    { value: 'mpesa', label: 'M-Pesa' },
  ],
};

export function PhoneStep({
  reference, currency, onAdvance,
}: {
  reference: string;
  currency: string;
  onAdvance: (state: PayState) => void;
}) {
  const [state, formAction] = useActionState(initiateMobileMoneyAction, emptyPayState);
  const networks = NETWORKS_BY_CURRENCY[currency] ?? NETWORKS_BY_CURRENCY.GHS;

  useEffect(() => {
    if (state.ok) onAdvance(state);
  }, [state, onAdvance]);

  return (
    <form action={formAction} className={formStyles.form}>
      <input type="hidden" name="reference" value={reference} />

      {state.message && !state.ok && (
        <Callout tone="danger" title="Could not start payment">{state.message}</Callout>
      )}

      <Field label="Mobile network" htmlFor="provider" required>
        {/* A disabled <select> never appears in FormData, so a single-network
            currency (Kenya, today) still just gets a one-option select rather
            than a disabled control that would silently drop `provider`. */}
        <select id="provider" name="provider" className={formStyles.input} defaultValue={networks[0].value} required>
          {networks.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
      </Field>

      <Field label="Phone number" htmlFor="phone" required error={state.fieldErrors?.phone}>
        <input
          id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
          className={formStyles.input} placeholder="0551234987" required
        />
      </Field>

      <SubmitButton pendingLabel="Starting payment…" fullWidth>Pay now</SubmitButton>
    </form>
  );
}
