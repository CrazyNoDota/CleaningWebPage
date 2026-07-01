import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from './types';

const KEY = 'cleaning.session';

type SessionListener = (session: Session | null) => void;
const listeners = new Set<SessionListener>();

/**
 * Subscribe to session changes that happen outside React (e.g. a silent token
 * refresh in the api layer). Returns an unsubscribe function.
 */
export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(session: Session | null): void {
  for (const listener of listeners) listener(session);
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
  emit(session);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  emit(null);
}
