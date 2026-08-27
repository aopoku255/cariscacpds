'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';

import type { SurveyState } from './state';

/**
 * Pulls `answers[<id>]` fields back out of the form — the same convention
 * (and the same reason: a checkbox group posts the same name repeatedly)
 * as the registration form's `collectAnswers` in
 * events/[slug]/register/actions.ts.
 */
function collectAnswers(formData: FormData): Record<string, string | string[]> {
  const answers: Record<string, string | string[]> = {};

  for (const [key, value] of formData.entries()) {
    const match = /^answers\[(\d+)\]$/.exec(key);
    if (!match || typeof value !== 'string' || value === '') continue;

    const id = match[1];
    const existing = answers[id];

    if (existing === undefined) answers[id] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else answers[id] = [existing, value];
  }

  return answers;
}

function mapFieldErrors(err: ApiError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    out[field.replace(/^answers\./, 'q-')] = message;
  }
  return out;
}

export async function submitSurveyAction(
  _prev: SurveyState,
  formData: FormData,
): Promise<SurveyState> {
  const reference = String(formData.get('reference') || '');
  const answers = collectAnswers(formData);

  if (Object.keys(answers).length === 0) {
    return { ok: false, message: 'Answer at least one question.' };
  }

  try {
    await apiAsUser(`/registrations/${encodeURIComponent(reference)}/evaluation`, {
      method: 'POST', body: { answers },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      const fieldErrors = mapFieldErrors(err);
      if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, code: err.code };

      if (err.status === 401) {
        redirect(`/login?next=${encodeURIComponent(`/dashboard/registrations/${reference}/survey`)}`);
      }

      const known: Record<string, string> = {
        EVENT_NOT_FINISHED: 'The survey opens once the programme has ended.',
        REGISTRATION_NOT_CONFIRMED: 'Your registration must be confirmed before you can complete the survey.',
      };

      return { ok: false, code: err.code, message: known[err.code] ?? err.message };
    }
    return { ok: false, message: 'We could not reach the server. Please try again.' };
  }

  revalidatePath(`/dashboard/registrations/${reference}`);
  redirect(`/dashboard/registrations/${reference}?surveySubmitted=1`);
}
