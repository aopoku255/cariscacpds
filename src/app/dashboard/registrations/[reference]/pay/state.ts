/** Kept out of actions.ts: a "use server" file may only export async functions. */
export interface VirtualAccount {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string;
}

export interface PayState {
  ok: boolean;
  /**
   * Which form to show next. `transfer` is Nigeria's bank transfer: the
   * account to pay into is shown here while the page waits for it to land.
   * `checkout` is Nigeria's OGateway hosted
   * page: it opens in a new tab while this page waits for the payment to
   * land. `waiting` covers any charge that settles on the customer's own
   * device (M-Pesa's STK push) or an unrecognized intermediate status, where
   * there's nothing left for our UI to collect.
   */
  step: 'phone' | 'transfer' | 'checkout' | 'otp' | 'pin' | 'waiting' | 'done';
  paymentReference?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  checkoutUrl?: string;
  virtualAccount?: VirtualAccount;
}

export const emptyPayState: PayState = { ok: false, step: 'phone' };
