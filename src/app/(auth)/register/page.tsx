import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import type { ReferenceData } from '@/lib/api/types';
import { RegisterAccountForm } from './RegisterAccountForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ next?: string }>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const user = await getSession();
  if (user) redirect(params.next && params.next.startsWith('/') ? params.next : '/dashboard');

  let countries: ReferenceData['countries'] = [];
  try {
    const { data } = await apiRequest<ReferenceData>('/reference', { revalidate: 3600 });
    countries = data.countries;
  } catch {
    // The country field degrades to empty rather than blocking sign-up.
  }

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.lede}>
            One account covers every CARISCA programme — CPD courses, the Summit and
            the Business Forum.
          </p>
        </header>
        <RegisterAccountForm next={params.next ?? '/dashboard'} countries={countries} />
      </div>
    </div>
  );
}
