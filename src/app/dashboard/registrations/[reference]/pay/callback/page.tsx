import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession, apiAsUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/client';
import type { Payment } from '@/lib/api/types';
import { Card, Callout, ButtonLink } from '@/components/ui';
import styles from '../../registration.module.css';

export const metadata: Metadata = { title: 'Confirming your payment', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Params = Promise<{ reference: string }>;
type SearchParams = Promise<{ reference?: string; trxref?: string }>;

/**
 * Where Paystack's card checkout redirects back to. `reference`/`trxref` in
 * the query string is Paystack echoing back the reference we gave it on
 * initiate — which is our own `Payment.reference`, so no separate mapping
 * step is needed to know which payment this is.
 */
export default async function PayCallbackPage({
  params, searchParams,
}: { params: Params; searchParams: SearchParams }) {
  const { reference } = await params;
  const { reference: paystackReference, trxref } = await searchParams;
  const paymentReference = paystackReference || trxref;

  const user = await getSession();
  if (!user) redirect(`/login?next=/dashboard/registrations/${reference}/pay/callback`);

  if (!paymentReference) {
    return (
      <div className="shell shell--narrow">
        <div className={styles.page}>
          <Callout tone="danger" title="We could not find that payment">
            The link you followed did not include a payment reference.
          </Callout>
          <div className={styles.footerActions}>
            <ButtonLink href={`/dashboard/registrations/${reference}/pay`}>Try again</ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  let payment: Payment;
  try {
    const { data } = await apiAsUser<Payment>(`/payments/${encodeURIComponent(paymentReference)}`);
    payment = data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      return (
        <div className="shell shell--narrow">
          <div className={styles.page}>
            <Callout tone="danger" title="We could not find that payment">
              It may belong to a different account.
            </Callout>
            <div className={styles.footerActions}>
              <ButtonLink href={`/dashboard/registrations/${reference}`}>Back to your registration</ButtonLink>
            </div>
          </div>
        </div>
      );
    }
    throw err;
  }

  const heading = payment.status === 'SUCCESSFUL'
    ? 'Payment received'
    : payment.status === 'FAILED' ? 'Payment did not go through' : 'Confirming your payment…';

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>{heading}</h1>
        </header>

        <Card>
          {payment.status === 'SUCCESSFUL' && (
            <Callout tone="success" title="You're all set">
              Your registration is confirmed. A confirmation email is on its way.
            </Callout>
          )}
          {payment.status === 'FAILED' && (
            <Callout tone="danger" title="That attempt failed">
              {payment.failureReason || 'Please try again.'}
            </Callout>
          )}
          {!['SUCCESSFUL', 'FAILED'].includes(payment.status) && (
            <Callout tone="info" title="Still confirming">
              Paystack has not told us the outcome yet. Refresh this page in a moment, or check your registration.
            </Callout>
          )}
        </Card>

        <div className={styles.footerActions}>
          <ButtonLink href={`/dashboard/registrations/${reference}`}>View your registration</ButtonLink>
        </div>
      </div>
    </div>
  );
}
