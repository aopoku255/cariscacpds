import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout } from '@/components/ui';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

type SearchParams = Promise<{ token?: string }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Choose a new password</h1>
        </header>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Callout tone="danger" title="This link is incomplete">
            Open the link from your email again, or <Link href="/forgot-password">request a new one</Link>.
          </Callout>
        )}
      </div>
    </div>
  );
}
