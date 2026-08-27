'use client';

import { useState } from 'react';
import { Callout } from '@/components/ui';
import type { Bank } from '@/lib/api/types';
import { PhoneStep } from './PhoneStep';
import { BankStep } from './BankStep';
import { BirthdayStep } from './BirthdayStep';
import { CodeStep } from './CodeStep';
import { WaitingStep } from './WaitingStep';
import { emptyPayState, type PayState } from './state';

/**
 * Owns the whole in-app charge flow — everything except card checkout,
 * which redirects to Paystack's own hosted page instead. The first step
 * differs by channel (a phone for mobile money, a bank account for
 * Nigeria); every step after that (birthday, OTP, PIN, or just waiting) is
 * shared, since Paystack's own `data.status` is what decides which one
 * comes next, not which channel started the charge.
 */
export function ChargeForm({
  reference, channel, currency, banks,
}: {
  reference: string;
  channel: 'mobile_money' | 'bank';
  currency: string;
  banks?: Bank[];
}) {
  const [view, setView] = useState<PayState>(emptyPayState);

  if (view.step === 'done') {
    return (
      <Callout tone="success" title="Payment received">
        Your registration is now confirmed.
      </Callout>
    );
  }

  if (view.paymentReference && view.step === 'birthday') {
    return <BirthdayStep reference={reference} paymentReference={view.paymentReference} hint={view.message} onAdvance={setView} />;
  }

  if (view.paymentReference && (view.step === 'otp' || view.step === 'pin')) {
    return (
      <CodeStep
        reference={reference}
        paymentReference={view.paymentReference}
        kind={view.step}
        hint={view.message}
        onAdvance={setView}
      />
    );
  }

  if (view.paymentReference && view.step === 'waiting') {
    return <WaitingStep paymentReference={view.paymentReference} hint={view.message} onAdvance={setView} />;
  }

  if (channel === 'bank') {
    return <BankStep reference={reference} banks={banks ?? []} onAdvance={setView} />;
  }

  return <PhoneStep reference={reference} currency={currency} onAdvance={setView} />;
}
