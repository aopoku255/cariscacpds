'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';
import type { Payment, PaymentInitiation } from '@/lib/api/types';

import type { PayState } from './state';

/**
 * Paystack's charge flows can ask for an OTP, a PIN, a birthday, or nothing
 * at all before landing on a terminal status — `data.status` says which, and
 * this maps that straight onto which form the page shows next. Anything not
 * specifically recognized (a bank charge left `pending`, M-Pesa's STK push,
 * or a status Paystack's own docs never actually confirmed for this app)
 * falls back to the waiting/polling screen rather than assuming an OTP
 * prompt is always next — there's nothing for our UI to collect in that
 * case, and guessing wrong would show an input box with nothing to submit.
 */
function stepFor(status: string): PayState['step'] {
  if (status === 'success') return 'done';
  if (status === 'send_pin' || status === 'pin') return 'pin';
  if (status === 'send_otp' || status === 'otp') return 'otp';
  if (status === 'send_birthday') return 'birthday';
  return 'waiting';
}

export async function initiateMobileMoneyAction(
  _prev: PayState,
  formData: FormData,
): Promise<PayState> {
  const reference = String(formData.get('reference') || '');
  const phone = String(formData.get('phone') || '').trim();
  const provider = String(formData.get('provider') || '');

  if (!phone) {
    return { ok: false, step: 'phone', fieldErrors: { phone: 'Enter the phone number to charge.' } };
  }

  try {
    const { data } = await apiAsUser<PaymentInitiation>('/payments/initiate', {
      method: 'POST',
      body: {
        registrationReference: reference,
        channel: 'mobile_money',
        mobileMoney: { phone, provider },
      },
    });

    if (data.status === 'success') {
      revalidatePath(`/dashboard/registrations/${reference}`);
      return { ok: true, step: 'done', paymentReference: data.reference };
    }

    return {
      ok: true,
      step: stepFor(data.status),
      paymentReference: data.reference,
      message: data.displayText ?? 'Check your phone to complete the payment.',
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, step: 'phone', message: err.message };
    return { ok: false, step: 'phone', message: 'We could not reach the server. Please try again.' };
  }
}

async function submitCode(
  reference: string,
  paymentReference: string,
  value: string,
  path: 'submit-otp' | 'submit-pin' | 'submit-birthday',
  field: 'otp' | 'pin' | 'birthday',
  fallbackStep: PayState['step'],
): Promise<PayState> {
  try {
    const { data } = await apiAsUser<{ status: string; message: string | null }>(
      `/payments/${encodeURIComponent(paymentReference)}/${path}`,
      { method: 'POST', body: { [field]: value } },
    );

    if (data.status === 'success') {
      revalidatePath(`/dashboard/registrations/${reference}`);
      return { ok: true, step: 'done', paymentReference };
    }

    return {
      ok: false,
      step: stepFor(data.status),
      paymentReference,
      message: data.message || 'That was not accepted. Please try again.',
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, step: fallbackStep, paymentReference, message: err.message };
    return { ok: false, step: fallbackStep, paymentReference, message: 'We could not reach the server. Please try again.' };
  }
}

export async function submitOtpAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');
  const paymentReference = String(formData.get('paymentReference') || '');
  const otp = String(formData.get('otp') || '').trim();

  if (!otp) return { ok: false, step: 'otp', paymentReference, fieldErrors: { otp: 'Enter the code you received.' } };
  return submitCode(reference, paymentReference, otp, 'submit-otp', 'otp', 'otp');
}

export async function submitPinAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');
  const paymentReference = String(formData.get('paymentReference') || '');
  const pin = String(formData.get('pin') || '').trim();

  if (!pin) return { ok: false, step: 'pin', paymentReference, fieldErrors: { pin: 'Enter your mobile money PIN.' } };
  return submitCode(reference, paymentReference, pin, 'submit-pin', 'pin', 'pin');
}

export async function submitBirthdayAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');
  const paymentReference = String(formData.get('paymentReference') || '');
  const birthday = String(formData.get('birthday') || '').trim();

  if (!birthday) {
    return { ok: false, step: 'birthday', paymentReference, fieldErrors: { birthday: 'Enter your date of birth.' } };
  }
  return submitCode(reference, paymentReference, birthday, 'submit-birthday', 'birthday', 'birthday');
}

/**
 * Nigeria's bank charge, same shape as `initiateMobileMoneyAction` below —
 * the account is entered in our own form (no redirect), and Paystack's
 * `data.status` says what to collect next (a birthday, an OTP, or nothing
 * while the customer's bank processes it).
 */
export async function initiateBankAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');
  const code = String(formData.get('bankCode') || '');
  const accountNumber = String(formData.get('accountNumber') || '').trim();

  if (!code || !accountNumber) {
    return { ok: false, step: 'bank', fieldErrors: { accountNumber: 'Choose a bank and enter the account number.' } };
  }

  try {
    const { data } = await apiAsUser<PaymentInitiation>('/payments/initiate', {
      method: 'POST',
      body: {
        registrationReference: reference,
        channel: 'bank',
        bank: { code, accountNumber },
      },
    });

    if (data.status === 'success') {
      revalidatePath(`/dashboard/registrations/${reference}`);
      return { ok: true, step: 'done', paymentReference: data.reference };
    }

    return {
      ok: true,
      step: stepFor(data.status),
      paymentReference: data.reference,
      message: data.displayText ?? 'Confirming the payment with your bank.',
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, step: 'bank', message: err.message };
    return { ok: false, step: 'bank', message: 'We could not reach the server. Please try again.' };
  }
}

/** Polled by `WaitingStep` for charges that settle on the customer's own device (M-Pesa, a bank app). */
export async function checkPaymentStatusAction(paymentReference: string): Promise<PayState> {
  try {
    const { data } = await apiAsUser<Payment>(`/payments/${encodeURIComponent(paymentReference)}`);

    if (data.status === 'SUCCESSFUL') return { ok: true, step: 'done', paymentReference };
    if (data.status === 'FAILED') {
      return {
        ok: false, step: 'waiting', paymentReference, message: data.failureReason || 'That payment did not go through.',
      };
    }
    return { ok: true, step: 'waiting', paymentReference };
  } catch {
    return { ok: true, step: 'waiting', paymentReference };
  }
}

/**
 * Card checkout has nowhere to redirect *to* except Paystack's own hosted
 * page — success or failure, this action either lands the browser there or
 * returns an error for the same form to show.
 */
export async function initiateCardPaymentAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');
  let checkoutUrl: string;

  try {
    const { data } = await apiAsUser<PaymentInitiation>('/payments/initiate', {
      method: 'POST',
      body: { registrationReference: reference, channel: 'card' },
    });
    if (!data.checkoutUrl) return { ok: false, step: 'phone', message: 'Paystack did not return a checkout link.' };
    checkoutUrl = data.checkoutUrl;
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, step: 'phone', message: err.message };
    return { ok: false, step: 'phone', message: 'We could not reach the server. Please try again.' };
  }

  redirect(checkoutUrl);
}
