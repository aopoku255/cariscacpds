'use client';

import { useEffect, useRef, useState } from 'react';
import { Callout } from '@/components/ui';
import { checkPaymentStatusAction } from './actions';
import type { PayState } from './state';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 40; // ~2 minutes

/**
 * No user input to collect — used when the charge settles on the customer's
 * own device (M-Pesa's STK push, a bank's own confirmation step) or when the
 * status Paystack returned isn't one this app specifically prompts for.
 * Polls `GET /payments/:reference` (routed to Paystack for these channels —
 * see payment.routes.js) until a terminal status arrives.
 */
export function WaitingStep({
  paymentReference, hint, onAdvance,
}: {
  paymentReference: string;
  hint?: string;
  onAdvance: (state: PayState) => void;
}) {
  const [timedOut, setTimedOut] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;

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

    let timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentReference, onAdvance]);

  if (failure) {
    return <Callout tone="danger" title="That did not work">{failure}</Callout>;
  }

  if (timedOut) {
    return (
      <Callout tone="info" title="Still waiting">
        This is taking longer than expected. Refresh this page in a moment to check again.
        Your payment may still complete.
      </Callout>
    );
  }

  return (
    <Callout tone="info" title="Confirming your payment">
      {hint ?? 'This can take a minute. Do not close this page.'}
    </Callout>
  );
}
