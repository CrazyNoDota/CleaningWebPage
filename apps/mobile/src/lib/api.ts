import Constants from 'expo-constants';
import { clearSession, loadSession, saveSession } from './auth';
import type {
  Address,
  CleanerCard,
  CleanerReview,
  Locale,
  Order,
  Payment,
  Quote,
  Service,
  Session,
} from './types';

const extra = Constants.expoConfig?.extra as { apiUrl?: string; wsUrl?: string } | undefined;

export const API_BASE = extra?.apiUrl ?? 'https://cleaning-api-six.vercel.app/api/v1';
export const WS_BASE = extra?.wsUrl ?? 'https://cleaning-api-six.vercel.app';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  locale?: Locale;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (opts.locale) headers['accept-language'] = opts.locale;

  if (opts.auth !== false) {
    const session = await loadSession();
    if (session?.accessToken) headers.authorization = `Bearer ${session.accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.authorization = `Bearer ${refreshed.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
    }
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const json = (await res.json()) as { message?: string | string[] };
      if (json.message) msg = Array.isArray(json.message) ? json.message.join('; ') : json.message;
    } catch {
      // Keep HTTP fallback message.
    }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function tryRefresh(): Promise<Session | null> {
  const session = await loadSession();
  if (!session?.refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const next = (await res.json()) as Session;
    await saveSession(next);
    return next;
  } catch {
    return null;
  }
}

export function requestOtp(phone: string) {
  return request<void>('/auth/otp/request', { method: 'POST', body: { phone }, auth: false });
}

export function verifyOtp(phone: string, code: string, name?: string) {
  return request<Session>('/auth/otp/verify', {
    method: 'POST',
    body: { phone, code, name: name || undefined },
    auth: false,
  });
}

export function listServices(locale: Locale = 'ru', city = 'astana') {
  const qs = `city=${encodeURIComponent(city)}&locale=${encodeURIComponent(locale)}`;
  return request<Service[]>(`/services?${qs}`, { auth: false, locale });
}

export function quote(input: {
  serviceSlug: string;
  inputs: Record<string, number>;
  options?: { key: string; qty?: number }[];
}) {
  return request<Quote>('/pricing/quote', { method: 'POST', body: input, auth: false });
}

export function createAddress(body: {
  city: string;
  label?: string;
  street: string;
  building: string;
  apartment?: string;
  comment?: string;
}) {
  return request<Address>('/addresses', { method: 'POST', body });
}

export function listAddresses() {
  return request<Address[]>('/addresses');
}

export function listOrders() {
  return request<Order[]>('/orders');
}

export function createOrder(body: {
  serviceSlug: string;
  scheduledAt: string;
  addressId: string;
  inputs: Record<string, number>;
  options?: { key: string; qty?: number }[];
  notes?: string;
  source?: 'web' | 'mobile';
}) {
  return request<Order>('/orders', { method: 'POST', body });
}

export function getOrder(id: string) {
  return request<Order & { events?: Array<{ type: string; createdAt: string }> }>(`/orders/${id}`);
}

export function listCleaners(locale: Locale = 'ru', take = 12, skip = 0) {
  const qs = new URLSearchParams({ locale, take: String(take), skip: String(skip) }).toString();
  return request<CleanerCard[]>(`/cleaners?${qs}`, { auth: false, locale });
}

export function getCleaner(id: string, locale: Locale = 'ru') {
  return request<CleanerCard>(`/cleaners/${id}?locale=${locale}`, { auth: false, locale });
}

export function listCleanerReviews(id: string, take = 20, skip = 0) {
  const qs = new URLSearchParams({ take: String(take), skip: String(skip) }).toString();
  return request<CleanerReview[]>(`/cleaners/${id}/reviews?${qs}`, { auth: false });
}

export function getOrderCleaner(id: string, locale: Locale = 'ru') {
  return request<{ status: string; cleaner: CleanerCard | null }>(
    `/orders/${id}/cleaner?locale=${locale}`,
    { locale },
  );
}

export function initiatePayment(orderId: string, idempotencyKey?: string) {
  return request<Payment>(`/orders/${orderId}/payments`, {
    method: 'POST',
    body: { idempotencyKey },
  });
}

export function confirmStubPayment(paymentId: string) {
  return request<Payment>(`/payments/${paymentId}/stub/confirm`, {
    method: 'POST',
  });
}

export function getPaymentStatus(paymentId: string) {
  return request<Payment>(`/payments/${paymentId}`, { method: 'GET' });
}

export interface SubmitApplicationBody {
  fullName: string;
  phone: string;
  cityFreeText?: string;
  age?: number;
  experience?: string;
  resumeUrl?: string;
  source?: string;
}

export function submitApplication(body: SubmitApplicationBody) {
  return request<{ id: string; fullName: string; createdAt: string }>('/applications', {
    method: 'POST',
    body: { ...body, source: body.source ?? 'mobile' },
    auth: false,
  });
}

export function registerDeviceToken(token: string) {
  return request<{ registered: true }>('/users/me/device-tokens', {
    method: 'POST',
    body: { token },
  });
}

export function unregisterDeviceToken(token: string) {
  return request<{ registered: false }>('/users/me/device-tokens', {
    method: 'DELETE',
    body: { token },
  });
}

export function deleteAccount() {
  return request<void>('/users/me', { method: 'DELETE' });
}
