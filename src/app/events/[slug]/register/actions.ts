'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';
import type { Registration, Money } from '@/lib/api/types';

import type { RegisterState } from './state';

/**
 * Pulls `answers[<id>]` fields back out of the form.
 *
 * A checkbox group posts the same name repeatedly, so anything appearing more
 * than once becomes an array — which is what the API's MULTISELECT validator
 * expects.
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

/**
 * Field errors come back keyed `answers.<questionId>`; the form renders them
 * against `q-<questionId>`. Translate once here rather than in the component.
 */
function mapFieldErrors(err: ApiError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    out[field.replace(/^answers\./, 'q-')] = message;
  }
  return out;
}

export async function registerForEventAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const eventId = String(formData.get('eventId') || '');
  const slug = String(formData.get('slug') || '');
  const attendanceMode = String(formData.get('attendanceMode') || 'IN_PERSON');

  if (formData.get('mediaConsent') !== 'on') {
    return {
      ok: false,
      fieldErrors: { mediaConsent: 'Please confirm you understand sessions are recorded.' },
    };
  }

  const body = {
    eventId: Number(eventId),
    attendanceMode,
    answers: collectAnswers(formData),
    comments: String(formData.get('comments') || '') || undefined,
    specialRequirements: String(formData.get('specialRequirements') || '') || undefined,
    wantsCertificate: formData.get('wantsCertificate') === 'yes',
    isPreviousAttendee: formData.get('isPreviousAttendee') === 'yes',
    mediaConsent: true,
    preferredCurrency: String(formData.get('preferredCurrency') || '') || undefined,
  };

  let result: { registration: Registration; payment: { amount: Money } | null };

  try {
    const { data } = await apiAsUser<typeof result>('/registrations', { method: 'POST', body });
    result = data;
  } catch (err) {
    if (err instanceof ApiError) {
      const fieldErrors = mapFieldErrors(err);
      if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, code: err.code };

      if (err.status === 401) {
        redirect(`/login?next=${encodeURIComponent(`/events/${slug}/register`)}`);
      }

      // These are ordinary outcomes, not faults — say what happened plainly.
      const known: Record<string, string> = {
        ALREADY_REGISTERED: 'You are already registered for this event. Check your dashboard for the details.',
        EVENT_FULL: 'This event filled up while you were completing the form. No place has been reserved.',
        REGISTRATION_CLOSED: 'Registration for this event has closed.',
        EVENT_CANCELLED: 'This event has been cancelled.',
        MODE_UNAVAILABLE: 'That way of attending is not available for this event.',
        NO_MATCHING_PRICE: 'We could not work out a fee for you. Please contact us before registering.',
      };

      return { ok: false, code: err.code, message: known[err.code] ?? err.message };
    }
    return { ok: false, message: 'We could not reach the server. Nothing has been registered. Please try again.' };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/registrations/${result.registration.reference}?new=1`);
}
