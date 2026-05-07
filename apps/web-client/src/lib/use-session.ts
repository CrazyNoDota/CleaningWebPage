'use client';

import { useEffect, useState } from 'react';
import { clearSession, loadSession } from './auth';
import type { Session } from './types';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cleaning.session') setSession(loadSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return {
    session,
    hydrated,
    signOut: () => {
      clearSession();
      setSession(null);
    },
  };
}
