import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff, visibleNav } from '@/lib/auth/require-staff';
import { logoutAction } from '@/lib/auth/actions';
import { AdminNav } from './AdminNav';
import styles from './admin.module.css';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · CARISCA Admin' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const nav = visibleNav(user);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <Link href="/admin" className={styles.brand}>
            <span className={styles.brandMark}>CARISCA</span>
            <span className={styles.brandSub}>Administration</span>
          </Link>
        </div>

        <AdminNav items={nav} />

        <div className={styles.sidebarFoot}>
          <p className={styles.who}>{user.fullName}</p>
          <p className={styles.role}>
            {user.roles?.map((r) => r.name).join(', ') || 'Staff'}
          </p>
          <div className={styles.footLinks}>
            <Link href="/">View the site</Link>
            <form action={logoutAction}>
              <button type="submit" className={styles.signOut}>Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
