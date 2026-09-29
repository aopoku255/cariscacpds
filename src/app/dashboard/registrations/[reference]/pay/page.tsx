import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, apiAsUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/client';
import type { Registration } from '@/lib/api/types';
import { Card } from '@/components/ui';
import { money } from '@/lib/format';
import { ChargeForm } from './ChargeForm';
import { CardPayForm } from './CardPayForm';
import styles from '../registration.module.css';

export const metadata: Metadata = { title: 'Pay for your registration', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Params = Promise<{ reference: string }>;

/**
 * Which payment flow a currency routes through — mirrors
 * `MOBILE_MONEY_CURRENCIES`/`BANK_TRANSFER_CURRENCIES` in payment.service.js.
 * Channel availability follows the transaction currency/market, not a raw
 * country field, so currency (itself already resolved from the
 * participant's country at registration time) is the right signal here too.
 * Nigeria (NGN) pays by bank transfer through OGateway.
 */
function channelFor(currency: string | undefined): 'mobile_money' | 'bank_transfer' | 'card' {
  if (currency === 'GHS' || currency === 'KES') return 'mobile_money';
  if (currency === 'NGN') return 'bank_transfer';
  return 'card';
}

export default async function PayPage({ params }: { params: Params }) {
  const { reference } = await params;

  const user = await getSession();
  if (!user) redirect(`/login?next=/dashboard/registrations/${reference}/pay`);

  let registration: Registration;
  try {
    const { data } = await apiAsUser<Registration>(`/registrations/${encodeURIComponent(reference)}`);
    registration = data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  // Nothing to pay for any more — paid already, hold expired, cancelled.
  if (registration.status !== 'PENDING_PAYMENT') {
    redirect(`/dashboard/registrations/${reference}`);
  }

  const currency = registration.amount?.currency;
  const channel = channelFor(currency);

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <Link href={`/dashboard/registrations/${reference}`} className={styles.back}>
          <span aria-hidden="true">← </span>Back to your registration
        </Link>

        <header className={styles.head}>
          <h1 className={styles.title}>Pay for {registration.event?.title ?? 'your registration'}</h1>
        </header>

        <Card className={styles.payCard}>
          <div className={styles.payAmount}>
            <span>Amount due</span>
            <strong>{money(registration.amount)}</strong>
          </div>

          {channel === 'card' ? (
            <CardPayForm reference={reference} />
          ) : (
            <ChargeForm
              reference={reference}
              channel={channel}
              currency={currency ?? ''}
              amount={money(registration.amount)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
