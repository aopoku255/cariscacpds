/** Kept out of actions.ts: a "use server" file may only export async functions. */
export interface PayState {
  ok: boolean;
  /**
   * Which form to show next. `bank`/`birthday` only apply to the Nigeria
   * bank-charge flow; `waiting` covers any charge that settles on the
   * customer's own device (M-Pesa's STK push) or an unrecognized
   * intermediate status, where there's nothing left for our UI to collect.
   */
  step: 'phone' | 'bank' | 'birthday' | 'otp' | 'pin' | 'waiting' | 'done';
  paymentReference?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const emptyPayState: PayState = { ok: false, step: 'phone' };
