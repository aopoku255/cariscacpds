import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { LoginForm } from './LoginForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ next?: string; reset?: string; verified?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const user = await getSession();
  if (user) redirect(params.next && params.next.startsWith('/') ? params.next : '/dashboard');

  const notice = params.reset
    ? 'Your password has been changed. Sign in with your new password.'
    : params.verified
      ? 'Your email is confirmed. You can sign in now.'
      : undefined;

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.lede}>
            Access your registrations, certificates and event details.
          </p>
        </header>
        <LoginForm next={params.next ?? '/dashboard'} notice={notice} />
      </div>
    </div>
  );
}
