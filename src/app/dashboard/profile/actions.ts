'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';
import type { FormState } from '@/lib/auth/form-state';

function toState(err: unknown): FormState {
  if (err instanceof ApiError) {
    const fieldErrors = err.fieldErrors;
    if (err.status === 401) {
      return { ok: false, message: 'Your session has expired. Please sign in again.' };
    }
    return {
      ok: false,
      message: Object.keys(fieldErrors).length ? undefined : err.message,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    };
  }
  return { ok: false, message: 'We could not reach the server. Please try again.' };
}

/** Trimmed, or undefined when the field was left empty. */
const str = (fd: FormData, key: string) => {
  const value = fd.get(key);
  const trimmed = value === null ? '' : String(value).trim();
  return trimmed === '' ? undefined : trimmed;
};

/**
 * Only same-origin paths may be redirected to.
 *
 * `next` arrives in a link anyone can craft — "//evil.example" is a
 * protocol-relative URL the browser would happily follow off-site.
 */
function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string' || !value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

export async function updateProfileAction(
  _prev: FormState, formData: FormData,
): Promise<FormState> {
  /**
   * The API's schema is .strict(), so an unexpected key is a 422 rather than
   * being ignored — email in particular, which is deliberately not editable
   * here because changing it has to re-verify.
   *
   * Cleared optional fields are sent as null, not "": countryCode is
   * .length(2) and would reject an empty string outright.
   */
  const body = {
    prefix: str(formData, 'prefix') ?? null,
    firstName: str(formData, 'firstName'),
    middleName: str(formData, 'middleName') ?? null,
    lastName: str(formData, 'lastName'),
    suffix: str(formData, 'suffix') ?? null,
    gender: str(formData, 'gender') ?? null,
    phone: str(formData, 'phone') ?? null,
    organization: str(formData, 'organization') ?? null,
    jobTitle: str(formData, 'jobTitle') ?? null,
    positionKey: str(formData, 'positionKey') ?? null,
    sectorKey: str(formData, 'sectorKey') ?? null,
    countryCode: str(formData, 'countryCode') ?? null,
    city: str(formData, 'city') ?? null,
    stateProvince: str(formData, 'stateProvince') ?? null,
    emailOptOut: formData.get('emailOptOut') === 'on',
  };

  try {
    await apiAsUser('/users/me', { method: 'PATCH', body });
  } catch (err) {
    return toState(err);
  }

  revalidatePath('/dashboard/profile');
  // The dashboard greets people by name, and registration quotes depend on the
  // country — both go stale the moment this saves.
  revalidatePath('/dashboard');

  // Sent here from a registration flow: put them back where they were.
  const next = safeNext(formData.get('next'));
  if (next) redirect(next);

  return { ok: true, message: 'Your details have been saved.' };
}
