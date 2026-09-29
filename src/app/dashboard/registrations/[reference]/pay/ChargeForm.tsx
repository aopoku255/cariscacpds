'use client';

import { useState } from 'react';
import { Button, Callout } from '@/components/ui';
import { PhoneStep } from './PhoneStep';
import { CheckoutStart, CheckoutStep } from './CheckoutStep';
import { TransferStart, TransferStep } from './TransferStep';
import { CodeStep } from './CodeStep';
import { WaitingStep } from './WaitingStep';
import formStyles from '@/components/ui/ui.module.css';
import { emptyPayState, type PayState } from './state';

/**
 * Owns the whole in-app payment flow — everything except card checkout,
 * which redirects to Paystack's own hosted page instead. The first step
 * differs by channel (a phone for mobile money, a choice between bank
 * transfer and OGateway's hosted payment page for Nigeria); after a mobile-money charge starts,
 * Paystack's own `data.status` decides whether an OTP, a PIN or just
 * waiting comes next.
 */
export function ChargeForm({
  reference, channel, currency, amount,
}: {
  reference: string;
  channel: 'mobile_money' | 'ngn';
  currency: string;
  amount: string;
}) {
  const [view, setView] = useState<PayState>(emptyPayState);
  // Nigeria only: which way the participant chose to pay.
  const [choice, setChoice] = useState<'transfer' | 'checkout' | null>(null);

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

  if (view.paymentReference && view.step === 'checkout' && view.checkoutUrl) {
    return (
      <CheckoutStep
        paymentReference={view.paymentReference}
        checkoutUrl={view.checkoutUrl}
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

  if (channel === 'ngn') {
    if (choice === 'transfer') {
      return <TransferStart reference={reference} onAdvance={setView} onBack={() => setChoice(null)} />;
    }
    if (choice === 'checkout') {
      return <CheckoutStart reference={reference} onAdvance={setView} onBack={() => setChoice(null)} />;
    }
    return (
      <div className={formStyles.form}>
        <p>How would you like to pay?</p>
        <Button type="button" fullWidth onClick={() => setChoice('transfer')}>
          Bank transfer (stay on this page)
        </Button>
        <Button type="button" variant="secondary" fullWidth onClick={() => setChoice('checkout')}>
          Pay on our payment partner&apos;s page (card, bank and more)
        </Button>
      </div>
    );
  }

  return <PhoneStep reference={reference} currency={currency} onAdvance={setView} />;
}
