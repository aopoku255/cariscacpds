'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';
import type { AbstractSubmission } from '@/lib/api/types';
import type { AbstractState } from './state';

/** One co-author name per line — kept plain, the same convention CPD's
 *  learning-objectives and target-audience fields already use. */
function collectCoAuthors(formData: FormData) {
  const raw = String(formData.get('coAuthors') || '');
  const names = raw.split('\n').map((s) => s.trim()).filter(Boolean);
  return names.length ? names.map((name) => ({ name })) : undefined;
}

export async function submitAbstractAction(
  _prev: AbstractState,
  formData: FormData,
): Promise<AbstractState> {
  const eventId = String(formData.get('eventId') || '');
  const slug = String(formData.get('slug') || '');
  const trackId = String(formData.get('trackId') || '');

  const body = {
    eventId: Number(eventId),
    title: String(formData.get('title') || '').trim(),
    abstractText: String(formData.get('abstractText') || '').trim(),
    trackId: trackId ? Number(trackId) : undefined,
    coAuthors: collectCoAuthors(formData),
  };

  let submission: AbstractSubmission;
  try {
    const { data } = await apiAsUser<AbstractSubmission>('/summit/abstracts', { method: 'POST', body });
    submission = data;
  } catch (err) {
    if (err instanceof ApiError) {
      if (Object.keys(err.fieldErrors).length) return { ok: false, fieldErrors: err.fieldErrors, code: err.code };

      if (err.status === 401) {
        redirect(`/login?next=${encodeURIComponent(`/events/${slug}/abstracts`)}`);
      }

      const known: Record<string, string> = {
        CALL_FOR_PAPERS_CLOSED: 'The call for papers for this event has closed.',
      };

      return { ok: false, code: err.code, message: known[err.code] ?? err.message };
    }
    return { ok: false, message: 'We could not reach the server. Nothing has been submitted. Please try again.' };
  }

  revalidatePath('/dashboard/abstracts');
  redirect(`/dashboard/abstracts/${submission.reference}?submitted=1`);
}
