'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';

export interface WithdrawState { ok: boolean; message?: string }
export const emptyWithdrawState: WithdrawState = { ok: false };

/**
 * The participant-facing routes key submissions by their numeric id, not the
 * reference in the URL — `reference` is what a person reads and quotes back,
 * `id` is what the mutation endpoints actually take. The detail page looks
 * one up from the other before rendering, and hands the id to this form.
 */
export async function withdrawAbstractAction(
  _prev: WithdrawState, formData: FormData,
): Promise<WithdrawState> {
  const id = String(formData.get('id') || '');
  const reference = String(formData.get('reference') || '');

  try {
    await apiAsUser(`/summit/abstracts/mine/${id}/withdraw`, { method: 'POST' });
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, message: err.message };
    return { ok: false, message: 'We could not reach the server. Please try again.' };
  }

  revalidatePath('/dashboard/abstracts');
  revalidatePath(`/dashboard/abstracts/${reference}`);
  return { ok: true, message: 'Submission withdrawn.' };
}
