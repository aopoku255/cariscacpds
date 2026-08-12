import type { SessionUser } from '@/lib/api/types';

/**
 * Pure permission helpers, usable from both server and client components.
 *
 * The admin console is a separate application, so only the pure checks remain
 * here — the navigation definition moved with it.
 *
 * None of this is a security boundary. It decides what to render; the API
 * refuses every action independently.
 */
export function can(user: SessionUser | null, permission: string): boolean {
  return !!user?.permissions?.includes(permission);
}

export function canAny(user: SessionUser | null, ...permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}
