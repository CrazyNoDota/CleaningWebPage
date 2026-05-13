import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { registerDeviceToken } from './api';
import { clearSession, loadSession, saveSession } from './auth';
import { getExpoPushToken } from './push';
import type { Session } from './types';

type SessionContextValue = {
  session: Session | null;
  hydrated: boolean;
  setSession: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadSession()
      .then(setSessionState)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    getExpoPushToken()
      .then((token) => {
        if (!active || !token) return;
        return registerDeviceToken(token);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [session]);

  const setSession = useCallback(async (next: Session) => {
    await saveSession(next);
    setSessionState(next);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({ session, hydrated, setSession, signOut }),
    [hydrated, session, setSession, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
