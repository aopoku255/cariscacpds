import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from './session';
import type { SessionUser } from '@/lib/api/types';

/**
 * Guards the admin area.
 *
 * Convenience, not security: it decides what renders, while the API refuses
 * every action on its own permission check.
 */
export async function requireStaff(returnTo = '/admin'): Promise<SessionUser> {
  const user = await getSession();

  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!user.isStaff) redirect('/dashboard');

  return user;
}

export { can, canAny, visibleNav, ADMIN_NAV } from './permissions';
export type { NavItem } from './permissions';
