'use client';

import { useState } from 'react';
import { Callout } from '@/components/ui';
import { PhoneStep } from './PhoneStep';
import { TransferStart, TransferStep } from './TransferStep';
import { CodeStep } from './CodeStep';
import { WaitingStep } from './WaitingStep';
import { emptyPayState, type PayState } from './state';

/**
 * Owns the whole in-app payment flow — everything except card checkout,
 * which redirects to Paystack's own hosted page instead. The first step
 * differs by channel (a phone for mobile money, a request for a temporary
 * account for Nigerian bank transfer); after a mobile-money charge starts,
 * Paystack's own `data.status` decides whether an OTP, a PIN or just
 * waiting comes next.
 */
export function ChargeForm({
  reference, channel, currency, amount,
}: {
  reference: string;
  channel: 'mobile_money' | 'bank_transfer';
  currency: string;
  amount: string;
}) {
  const [view, setView] = useState<PayState>(emptyPayState);

  if (view.step === 'done') {
    return (
      <Callout tone="success" title="Payment received">
        Your registration is now confirmed.
      </Callout>
    );
  }

  if (view.paymentReference && view.step === 'transfer' && view.virtualAccount) {
    return (
      <TransferStep
        paymentReference={view.paymentReference}
        account={view.virtualAccount}
        amount={amount}
        onAdvance={setView}
      />
    );
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

  if (channel === 'bank_transfer') {
    return <TransferStart reference={reference} onAdvance={setView} />;
  }

  return <PhoneStep reference={reference} currency={currency} onAdvance={setView} />;
}
