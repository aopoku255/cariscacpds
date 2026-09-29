'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import formStyles from '@/components/ui/ui.module.css';
import { initiateBankTransferAction, checkPaymentStatusAction } from './actions';
import { emptyPayState, type PayState, type VirtualAccount } from './state';

const POLL_INTERVAL_MS = 5000;
// The temporary account lives 25 minutes, so polling stops a little after that.
const MAX_ATTEMPTS = 330;

/** Step one: nothing to fill in, just ask for an account to pay into. */
export function TransferStart({
  reference, onAdvance,
}: {
  reference: string;
  onAdvance: (state: PayState) => void;
}) {
  const [state, formAction] = useActionState(initiateBankTransferAction, emptyPayState);

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
        Pay by bank transfer from your banking app or USSD. We will give you a
        temporary account number to send the exact amount to.
      </p>

      <SubmitButton pendingLabel="Getting account details…" fullWidth>Get account details</SubmitButton>
    </form>
  );
}

/** Step two: show the account, then wait for the transfer to land. */
export function TransferStep({
  paymentReference, account, amount, onAdvance,
}: {
  paymentReference: string;
  account: VirtualAccount;
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
        <Callout tone="danger" title="This account has expired">
          {failure ?? 'We did not receive a transfer in time.'} If you already sent the money, do not
          send it again — it will be matched to your registration. Otherwise, get a new account below.
        </Callout>
        <button type="button" className={formStyles.input} onClick={() => onAdvance(emptyPayState)}>
          Get a new account
        </button>
      </div>
    );
  }

  return (
    <div className={formStyles.form}>
      <dl>
        <div><dt>Bank</dt><dd><strong>{account.bankName ?? '—'}</strong></dd></div>
        <div><dt>Account number</dt><dd><strong>{account.accountNumber}</strong></dd></div>
        <div><dt>Account name</dt><dd><strong>{account.accountName ?? '—'}</strong></dd></div>
        <div><dt>Amount to send</dt><dd><strong>{amount}</strong></dd></div>
      </dl>

      <Callout tone="info" title="Waiting for your transfer">
        Send exactly {amount} to this account within 25 minutes. It only works for this payment.
        This page updates by itself once the money arrives, so please do not close it.
      </Callout>
    </div>
  );
}
