'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ADMIN_ROLES, clearSession, loadSession } from './auth';
import type { Session } from './types';

/**
 * Hydrates the admin session from localStorage and **enforces** that
 * the user has a manager/admin role. Anything else is bounced to /login.
 *
 * Pass `protectedRoute = false` for the login page itself.
 */
export function useAdminSession(protectedRoute = true) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    setHydrated(true);
    if (protectedRoute && (!s || !ADMIN_ROLES.has(s.user.role))) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [protectedRoute, router, pathname]);

  return {
    session,
    hydrated,
    signOut: () => {
      clearSession();
      setSession(null);
      router.replace('/login');
    },
  };
}
