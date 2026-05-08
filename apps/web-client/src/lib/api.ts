import { clearSession, getAccessToken, loadSession, saveSession } from './auth';
import type {
  Address,
  CleanerCard,
  Locale,
  Order,
  Quote,
  Service,
  Session,
} from './types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
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
  if (opts.locale) {
    headers['accept-language'] = opts.locale;
  }
  if (opts.auth !== false) {
    const tok = getAccessToken();
    if (tok) headers.authorization = `Bearer ${tok}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  // Single retry after refresh on 401.
  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.authorization = `Bearer ${refreshed.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        cache: 'no-store',
      });
    }
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (j?.message) {
        msg = Array.isArray(j.message) ? j.message.join('; ') : j.message;
      }
    } catch {
      /* keep default */
    }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function tryRefresh(): Promise<Session | null> {
  const session = loadSession();
  if (!session?.refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const next = (await res.json()) as Session;
    saveSession(next);
    return next;
  } catch {
    return null;
  }
}

// ── Auth ────────────────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<void> {
  await request('/auth/otp/request', { method: 'POST', body: { phone }, auth: false });
}

export async function verifyOtp(phone: string, code: string): Promise<Session> {
  return request<Session>('/auth/otp/verify', {
    method: 'POST',
    body: { phone, code },
    auth: false,
  });
}

// ── Catalog & pricing ───────────────────────────────────────────────

export function listServices(locale: Locale, citySlug = 'astana') {
  const qs = new URLSearchParams({ city: citySlug, locale }).toString();
  return request<Service[]>(`/services?${qs}`, { auth: false, locale });
}

export function getService(slug: string, locale: Locale) {
  return request<Service>(`/services/${slug}?locale=${locale}`, {
    auth: false,
    locale,
  });
}

export function quote(input: {
  serviceSlug: string;
  inputs: Record<string, number>;
  options?: { key: string; qty?: number }[];
}) {
  return request<Quote>('/pricing/quote', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

// ── Addresses ───────────────────────────────────────────────────────

export function listAddresses() {
  return request<Address[]>('/addresses');
}

export function createAddress(body: {
  city: string;
  label?: string;
  street: string;
  building: string;
  apartment?: string;
  comment?: string;
  lat?: number;
  lng?: number;
}) {
  return request<Address>('/addresses', { method: 'POST', body });
}

export function updateAddress(
  id: string,
  body: {
    city?: string;
    label?: string;
    street?: string;
    building?: string;
    apartment?: string;
    comment?: string;
    lat?: number;
    lng?: number;
  },
) {
  return request<Address>(`/addresses/${id}`, { method: 'PATCH', body });
}

export function deleteAddress(id: string) {
  return request<void>(`/addresses/${id}`, { method: 'DELETE' });
}

// ── Orders ──────────────────────────────────────────────────────────

export function createOrder(body: {
  serviceSlug: string;
  scheduledAt: string;
  addressId: string;
  inputs: Record<string, number>;
  options?: { key: string; qty?: number }[];
  notes?: string;
}) {
  return request<Order>('/orders', { method: 'POST', body });
}

export function listOrders() {
  return request<Order[]>('/orders');
}

export function getOrder(id: string) {
  return request<Order & { events?: Array<{ type: string; createdAt: string }> }>(
    `/orders/${id}`,
  );
}

export function getOrderCleaner(id: string, locale: Locale) {
  return request<{ status: string; cleaner: CleanerCard | null }>(
    `/orders/${id}/cleaner?locale=${locale}`,
    { locale },
  );
}

// ── Job applications (cleaner careers form) ────────────────────────

export interface SubmitApplicationBody {
  fullName: string;
  phone: string;
  city?: string;
  cityFreeText?: string;
  age?: number;
  experience?: string;
  resumeUrl?: string;
  source?: string;
}

export function submitApplication(body: SubmitApplicationBody) {
  return request<{ id: string; fullName: string; createdAt: string }>(
    '/applications',
    { method: 'POST', body, auth: false },
  );
}

// ── Reviews ─────────────────────────────────────────────────────────

export function submitReview(
  orderId: string,
  body: { rating: number; comment?: string; tags?: string[] },
) {
  return request<{
    id: string;
    rating: number;
    comment: string | null;
    status: string;
    publishedAt: string | null;
  }>(`/orders/${orderId}/review`, { method: 'POST', body });
}
