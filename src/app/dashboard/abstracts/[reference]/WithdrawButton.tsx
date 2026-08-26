'use client';

import { useActionState, useState } from 'react';
import { Button, Callout } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { withdrawAbstractAction, emptyWithdrawState } from '../actions';

export function WithdrawButton({ id, reference }: { id: string; reference: string }) {
  const [state, formAction] = useActionState(withdrawAbstractAction, emptyWithdrawState);
  const [confirming, setConfirming] = useState(false);

  if (state.ok) {
    return <Callout tone="success">{state.message}</Callout>;
  }

  if (!confirming) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(true)}>
        Withdraw this submission
      </Button>
    );
  }

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="reference" value={reference} />
      {state.message && <Callout tone="danger">{state.message}</Callout>}
      <p>Withdraw this submission? This cannot be undone.</p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <SubmitButton variant="danger" size="sm" pendingLabel="Withdrawing…">Confirm withdrawal</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>Keep it</Button>
      </div>
    </form>
  );
}
