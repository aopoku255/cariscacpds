'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { apiRequest, ApiError } from '@/lib/api/client';
import type { SessionUser } from '@/lib/api/types';
import {
  setSessionCookies, clearSessionCookies, getRefreshToken, apiAsUser,
} from './session';

/**
 * Server actions for authentication. Credentials are posted to the server and
 * never touch client JavaScript, and the API is only ever reached from here.
 */

import type { FormState } from './form-state';

/** Turns any thrown API error into something a form can render. */
function toState(err: unknown): FormState {
  if (err instanceof ApiError) {
    const fieldErrors = err.fieldErrors;
    return {
      ok: false,
      message: Object.keys(fieldErrors).length ? undefined : err.message,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    };
  }
  return { ok: false, message: 'We could not reach the server. Please try again.' };
}

function zodToState(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}

// --- login -------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address.').email('That does not look like an email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return zodToState(parsed.error);

  const next = String(formData.get('next') || '/dashboard');

  try {
    const { data } = await apiRequest<{ user: SessionUser } & { accessToken: string; refreshToken: string }>(
      '/auth/login',
      { method: 'POST', body: parsed.data },
    );
    await setSessionCookies(data);
  } catch (err) {
    return toState(err);
  }

  // Only redirect to somewhere on this site — never to an attacker's URL.
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
}

// --- register ----------------------------------------------------------------
const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name.').max(80),
  lastName: z.string().trim().min(1, 'Enter your last name.').max(80),
  email: z.string().trim().min(1, 'Enter your email address.').email('That does not look like an email address.'),
  password: z.string().min(10, 'Use at least 10 characters.').max(200),
  countryCode: z.string().trim().length(2).optional().or(z.literal('')),
  organization: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(32).optional(),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    countryCode: formData.get('countryCode') || undefined,
    organization: formData.get('organization') || undefined,
    phone: formData.get('phone') || undefined,
  });
  if (!parsed.success) return zodToState(parsed.error);

  const next = String(formData.get('next') || '/dashboard');

  try {
    const { data } = await apiRequest<{ user: SessionUser; accessToken?: string; refreshToken?: string }>(
      '/auth/register',
      { method: 'POST', body: parsed.data },
    );
    // Some deployments require verification before issuing tokens; only set
    // cookies when the API actually returned a session.
    if (data.accessToken && data.refreshToken) {
      await setSessionCookies({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    } else {
      return { ok: true, message: 'Check your email to confirm your address.' };
    }
  } catch (err) {
    return toState(err);
  }

  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
}

// --- logout ------------------------------------------------------------------
export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    // Revoke server-side too; clearing the cookie alone leaves a live token.
    try {
      await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } });
    } catch { /* the local session goes regardless */ }
  }
  await clearSessionCookies();
  revalidatePath('/', 'layout');
  redirect('/');
}

// --- password reset ----------------------------------------------------------
export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') || '').trim();
  if (!email) return { ok: false, fieldErrors: { email: 'Enter your email address.' } };

  try {
    await apiRequest('/auth/forgot-password', { method: 'POST', body: { email } });
  } catch {
    // Deliberately indistinguishable from success: revealing which addresses
    // have accounts is an enumeration vector.
  }
  return {
    ok: true,
    message: 'If that address has an account, a reset link is on its way.',
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({
    token: z.string().min(1),
    password: z.string().min(10, 'Use at least 10 characters.'),
  }).safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  });
  if (!parsed.success) return zodToState(parsed.error);

  try {
    await apiRequest('/auth/reset-password', { method: 'POST', body: parsed.data });
  } catch (err) {
    return toState(err);
  }
  redirect('/login?reset=1');
}

// --- profile -----------------------------------------------------------------
export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: Record<string, unknown> = {};
  for (const key of [
    'prefix', 'firstName', 'middleName', 'lastName', 'suffix', 'gender',
    'phone', 'organization', 'jobTitle', 'positionKey', 'sectorKey', 'countryCode', 'city', 'stateProvince',
  ]) {
    const value = formData.get(key);
    if (value !== null && String(value).trim() !== '') body[key] = String(value).trim();
  }
  body.emailOptOut = formData.get('emailOptOut') === 'on';

  try {
    await apiAsUser('/users/me', { method: 'PATCH', body });
  } catch (err) {
    return toState(err);
  }

  revalidatePath('/dashboard');
  return { ok: true, message: 'Your details have been saved.' };
}
