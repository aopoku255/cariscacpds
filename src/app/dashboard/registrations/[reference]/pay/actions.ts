'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';
import type { Payment, PaymentInitiation } from '@/lib/api/types';

import type { PayState } from './state';

/**
 * Paystack's charge flows can ask for an OTP, a PIN, or nothing
 * at all before landing on a terminal status — `data.status` says which, and
 * this maps that straight onto which form the page shows next. Anything not
 * specifically recognized (M-Pesa's STK push,
 * or a status Paystack's own docs never actually confirmed for this app)
 * falls back to the waiting/polling screen rather than assuming an OTP
 * prompt is always next — there's nothing for our UI to collect in that
 * case, and guessing wrong would show an input box with nothing to submit.
 */
function stepFor(status: string): PayState['step'] {
  if (status === 'success') return 'done';
  if (status === 'send_pin' || status === 'pin') return 'pin';
  if (status === 'send_otp' || status === 'otp') return 'otp';
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
  path: 'submit-otp' | 'submit-pin',
  field: 'otp' | 'pin',
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

/**
 * Nigeria: asks the API for an OGateway hosted checkout session. There is no
 * form input — the participant picks their channel on OGateway's own page —
 * so the result is either a URL to open or an error.
 */
export async function initiateCheckoutAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');

  try {
    const { data } = await apiAsUser<PaymentInitiation>('/payments/initiate', {
      method: 'POST',
      body: { registrationReference: reference, channel: 'checkout' },
    });

    if (!data.checkoutUrl) {
      return { ok: false, step: 'checkout', message: 'We could not get a payment page. Please try again.' };
    }

    return {
      ok: true,
      step: 'checkout',
      paymentReference: data.reference,
      checkoutUrl: data.checkoutUrl,
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, step: 'checkout', message: err.message };
    return { ok: false, step: 'checkout', message: 'We could not reach the server. Please try again.' };
  }
}

/**
 * Nigeria, in-page: asks the API for a temporary OGateway virtual account
 * to display. No form input — name, phone and email come from the profile.
 */
export async function initiateBankTransferAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const reference = String(formData.get('reference') || '');

  try {
    const { data } = await apiAsUser<PaymentInitiation>('/payments/initiate', {
      method: 'POST',
      body: { registrationReference: reference, channel: 'bank_transfer' },
    });

    if (!data.virtualAccount) {
      return { ok: false, step: 'transfer', message: 'We could not get an account to pay into. Please try again.' };
    }

    return {
      ok: true,
      step: 'transfer',
      paymentReference: data.reference,
      virtualAccount: data.virtualAccount,
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, step: 'transfer', message: err.message };
    return { ok: false, step: 'transfer', message: 'We could not reach the server. Please try again.' };
  }
}

/** Polled by `WaitingStep` and `CheckoutStep` for payments that settle outside this page (M-Pesa's STK push, OGateway's hosted page). */
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
