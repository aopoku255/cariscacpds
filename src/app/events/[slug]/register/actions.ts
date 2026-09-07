'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { apiRequest, ApiError } from '@/lib/api/client';
import { apiAsUser, setSessionCookies } from '@/lib/auth/session';
import type { Registration, Money, SessionUser } from '@/lib/api/types';

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

/**
 * The fields both the signed-in and the guest registration forms submit —
 * everything about the event itself, as opposed to who is attending.
 */
function collectRegistrationFields(formData: FormData) {
  return {
    eventId: Number(formData.get('eventId') || ''),
    attendanceMode: String(formData.get('attendanceMode') || 'IN_PERSON'),
    answers: collectAnswers(formData),
    comments: String(formData.get('comments') || '') || undefined,
    specialRequirements: String(formData.get('specialRequirements') || '') || undefined,
    wantsCertificate: formData.get('wantsCertificate') === 'yes',
    isPreviousAttendee: formData.get('isPreviousAttendee') === 'yes',
    mediaConsent: true,
    preferredCurrency: String(formData.get('preferredCurrency') || '') || undefined,
  };
}

// These are ordinary outcomes, not faults — say what happened plainly.
const KNOWN_REGISTRATION_ERRORS: Record<string, string> = {
  ALREADY_REGISTERED: 'You are already registered for this event. Check your dashboard for the details.',
  EVENT_FULL: 'This event filled up while you were completing the form. No place has been reserved.',
  REGISTRATION_CLOSED: 'Registration for this event has closed.',
  EVENT_CANCELLED: 'This event has been cancelled.',
  MODE_UNAVAILABLE: 'That way of attending is not available for this event.',
  NO_MATCHING_PRICE: 'We could not work out a fee for you. Please contact us before registering.',
};

export async function registerForEventAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const slug = String(formData.get('slug') || '');

  if (formData.get('mediaConsent') !== 'on') {
    return {
      ok: false,
      fieldErrors: { mediaConsent: 'Please confirm you understand sessions are recorded.' },
    };
  }

  const body = collectRegistrationFields(formData);

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

      // The page itself already checks this before the form ever renders —
      // reaching here means the profile changed (or was cleared) in another
      // tab between then and submit. Same redirect either way.
      if (err.code === 'PROFILE_INCOMPLETE') {
        redirect(`/dashboard/profile?next=${encodeURIComponent(`/events/${slug}/register`)}`);
      }

      return { ok: false, code: err.code, message: KNOWN_REGISTRATION_ERRORS[err.code] ?? err.message };
    }
    return { ok: false, message: 'We could not reach the server. Nothing has been registered. Please try again.' };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/registrations/${result.registration.reference}?new=1`);
}

/**
 * Registering without an account first. The API creates one behind the
 * scenes and hands back a session the same shape /auth/login does — set the
 * cookies here exactly as loginAction would, so the participant lands on
 * their new registration already signed in rather than facing an inbox
 * check first.
 */
export async function registerGuestAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  if (formData.get('mediaConsent') !== 'on') {
    return {
      ok: false,
      fieldErrors: { mediaConsent: 'Please confirm you understand sessions are recorded.' },
    };
  }

  const body: Record<string, unknown> = {
    ...collectRegistrationFields(formData),
    firstName: String(formData.get('firstName') || '').trim(),
    lastName: String(formData.get('lastName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    countryCode: String(formData.get('countryCode') || '').trim(),
    gender: String(formData.get('gender') || '').trim(),
    organization: String(formData.get('organization') || '').trim(),
    jobTitle: String(formData.get('jobTitle') || '').trim(),
    positionKey: String(formData.get('positionKey') || '').trim(),
    sectorKey: String(formData.get('sectorKey') || '').trim(),
  };
  const password = String(formData.get('password') || '');
  if (password) body.password = password;

  let result: {
    user: SessionUser;
    accessToken: string;
    refreshToken: string;
    registration: Registration;
    payment: { amount: Money } | null;
  };

  try {
    const { data } = await apiRequest<typeof result>('/registrations/guest', { method: 'POST', body });
    result = data;
  } catch (err) {
    if (err instanceof ApiError) {
      const fieldErrors = mapFieldErrors(err);
      if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, code: err.code };

      if (err.code === 'EMAIL_HAS_ACCOUNT') {
        return {
          ok: false,
          code: err.code,
          message: 'An account with this email address already exists. Sign in to register.',
        };
      }

      return { ok: false, code: err.code, message: KNOWN_REGISTRATION_ERRORS[err.code] ?? err.message };
    }
    return { ok: false, message: 'We could not reach the server. Nothing has been registered. Please try again.' };
  }

  await setSessionCookies({ accessToken: result.accessToken, refreshToken: result.refreshToken });

  revalidatePath('/dashboard');
  redirect(`/dashboard/registrations/${result.registration.reference}?new=1`);
}
