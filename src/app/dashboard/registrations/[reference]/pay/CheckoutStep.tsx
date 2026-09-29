'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button, ButtonLink, Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import { initiateCheckoutAction, checkPaymentStatusAction } from './actions';
import { emptyPayState, type PayState } from './state';

const POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 360; // ~30 minutes

/** Step one: nothing to fill in, just ask for a payment page. */
export function CheckoutStart({
  reference, onAdvance, onBack,
}: {
  reference: string;
  onAdvance: (state: PayState) => void;
  onBack: () => void;
}) {
  const [state, formAction] = useActionState(initiateCheckoutAction, emptyPayState);

  useEffect(() => {
    if (state.ok) onAdvance(state);
  }, [state, onAdvance]);

  return (
    <form action={formAction} className={formStyles.form}>
      <input type="hidden" name="reference" value={reference} />

      {state.message && !state.ok && (
        <Callout tone="danger" title="Could not start payment">{state.message}</Callout>
      )}

      <p>
        You will pay on our payment partner&apos;s secure page, where you can choose
        how to pay. It opens in a new tab and this page confirms your registration
        as soon as the payment arrives.
      </p>

      <SubmitButton pendingLabel="Preparing payment…" fullWidth>Continue to payment</SubmitButton>
      <Button type="button" variant="ghost" onClick={onBack}>Choose another way to pay</Button>
    </form>
  );
}

/** Step two: link out to the hosted page and wait for the payment to land. */
export function CheckoutStep({
  paymentReference, checkoutUrl, amount, onAdvance,
}: {
  paymentReference: string;
  checkoutUrl: string;
  amount: string;
  onAdvance: (state: PayState) => void;
}) {
  const [timedOut, setTimedOut] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      attempts.current += 1;
      const result = await checkPaymentStatusAction(paymentReference);
      if (cancelled) return;

      if (result.step === 'done') {
        onAdvance(result);
        return;
      }
      if (!result.ok) {
        setFailure(result.message ?? 'That payment did not go through.');
        return;
      }
      if (attempts.current >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentReference, onAdvance]);

  if (failure || timedOut) {
    return (
      <div className={formStyles.form}>
        <Callout tone="danger" title="That payment did not go through">
          {failure ?? 'We did not receive a payment in time.'} If you were charged, do not pay again —
          contact us with your registration reference. Otherwise you can try again.
        </Callout>
        <Button type="button" variant="secondary" onClick={() => onAdvance(emptyPayState)}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className={formStyles.form}>
      <ButtonLink href={checkoutUrl} target="_blank" rel="noopener noreferrer" fullWidth>
        Open payment page ({amount})
      </ButtonLink>

      <Callout tone="info" title="Waiting for your payment">
        Complete the payment in the tab that opened. This page updates by itself once it
        arrives, so please keep it open. If no tab opened, use the button above.
      </Callout>
    </div>
  );
}
