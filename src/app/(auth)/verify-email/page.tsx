import type { Metadata } from 'next';
import { Callout } from '@/components/ui';
import { VerifyEmailForm } from './VerifyEmailForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Confirm your email', robots: { index: false } };

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Confirm your email</h1>
        </header>
        {token ? (
          <VerifyEmailForm token={token} />
        ) : (
          <Callout tone="danger" title="This link is incomplete">
            Open the link from your email again.
          </Callout>
        )}
      </div>
    </div>
  );
}
