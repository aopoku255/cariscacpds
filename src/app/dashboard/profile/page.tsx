import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiRequest, ApiError } from '@/lib/api/client';
import { apiAsUser } from '@/lib/auth/session';
import type { ReferenceData, UserProfile } from '@/lib/api/types';
import { Callout } from '@/components/ui';
import { ProfileForm } from './ProfileForm';
import styles from './profile.module.css';

export const metadata = { title: 'My details' };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ next?: string }>;

/** Empty vocabularies would render a form of unusable selects. */
const EMPTY_REFERENCE: ReferenceData = {
  countries: [], positions: [], sectors: [], currencies: [],
  genders: [], prefixes: [], suffixes: [],
};

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;

  let profile: UserProfile;
  try {
    // /users/me rather than the session user: this one carries the position,
    // sector and country joins the form's selects need.
    const { data } = await apiAsUser<UserProfile>('/users/me');
    profile = data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      const back = next ? `/dashboard/profile?next=${encodeURIComponent(next)}` : '/dashboard/profile';
      redirect(`/login?next=${encodeURIComponent(back)}`);
    }
    throw err;
  }

  let reference = EMPTY_REFERENCE;
  let referenceFailed = false;
  try {
    const { data } = await apiRequest<ReferenceData>('/reference', { revalidate: 3600 });
    reference = data;
  } catch {
    referenceFailed = true;
  }

  return (
    <div className="shell">
      <div className={styles.page}>
        <header className={styles.head}>
          <Link href="/dashboard" className={styles.back}>← My account</Link>
          <h1 className={styles.title}>My details</h1>
          <p className={styles.lede}>
            These appear on your certificates and on the badge you are scanned
            in with, so it is worth getting the spelling right before an event.
          </p>
        </header>

        {referenceFailed && (
          <Callout tone="warning" title="Some options could not be loaded">
            The country, position and sector lists are unavailable at the moment.
            Everything else can still be saved.
          </Callout>
        )}

        <ProfileForm profile={profile} reference={reference} next={next ?? null} />
      </div>
    </div>
  );
}
