import { clearSession, getAccessToken, loadSession, saveSession } from './auth';
import type {
  AdminApplication,
  AdminCleanerFull,
  AdminCleanerListItem,
  AdminMetrics,
  AdminOrderFull,
  AdminOrderListItem,
  AdminReview,
  CreateCleanerBody,
  DirectorSettings,
  JobApplicationStatusValue,
  OrderStatus,
  ReviewStatusValue,
  Session,
  UpdateCleanerBody,
} from './types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.auth !== false) {
    const tok = getAccessToken();
    if (tok) headers.authorization = `Bearer ${tok}`;
  }

  const exec = (h: Record<string, string>) =>
    fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers: h,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });

  let res = await exec(headers);
  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.authorization = `Bearer ${refreshed.accessToken}`;
      res = await exec(headers);
    }
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (j?.message) msg = Array.isArray(j.message) ? j.message.join('; ') : j.message;
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

export async function adminLogin(login: string, password: string): Promise<Session> {
  return request<Session>('/auth/admin/login', {
    method: 'POST',
    body: { login, password },
    auth: false,
  });
}

// ── Admin · Cleaners ───────────────────────────────────────────────

export function adminListCleaners(opts: {
  isActive?: boolean;
  verificationStatus?: string;
  take?: number;
  skip?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (opts.isActive !== undefined) qs.set('isActive', String(opts.isActive));
  if (opts.verificationStatus) qs.set('verificationStatus', opts.verificationStatus);
  if (opts.take !== undefined) qs.set('take', String(opts.take));
  if (opts.skip !== undefined) qs.set('skip', String(opts.skip));
  const q = qs.toString();
  return request<AdminCleanerListItem[]>(`/admin/cleaners${q ? `?${q}` : ''}`);
}

export function adminGetCleaner(id: string) {
  return request<AdminCleanerFull>(`/admin/cleaners/${id}`);
}

export function adminCreateCleaner(body: CreateCleanerBody) {
  return request<AdminCleanerFull>('/admin/cleaners', { method: 'POST', body });
}

export function adminUpdateCleaner(id: string, body: UpdateCleanerBody) {
  return request<AdminCleanerFull>(`/admin/cleaners/${id}`, { method: 'PATCH', body });
}

// ── Admin · Orders ─────────────────────────────────────────────────

export function adminListOrders(opts: {
  status?: OrderStatus;
  cleanerId?: string;
  userPhone?: string;
  take?: number;
  skip?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (opts.status) qs.set('status', opts.status);
  if (opts.cleanerId) qs.set('cleanerId', opts.cleanerId);
  if (opts.userPhone) qs.set('userPhone', opts.userPhone);
  if (opts.take !== undefined) qs.set('take', String(opts.take));
  if (opts.skip !== undefined) qs.set('skip', String(opts.skip));
  const q = qs.toString();
  return request<AdminOrderListItem[]>(`/admin/orders${q ? `?${q}` : ''}`);
}

export function adminGetOrder(id: string) {
  return request<AdminOrderFull>(`/admin/orders/${id}`);
}

export function adminAssignCleaner(orderId: string, cleanerId: string) {
  return request(`/admin/orders/${orderId}/assign`, {
    method: 'POST',
    body: { cleanerId },
  });
}

export function adminTransitionOrder(
  orderId: string,
  to: OrderStatus,
  note?: string,
) {
  return request(`/admin/orders/${orderId}/transition`, {
    method: 'POST',
    body: { to, note },
  });
}

// ── Admin · Reviews ────────────────────────────────────────────────

export function adminListReviews(opts: {
  status?: ReviewStatusValue;
  take?: number;
  skip?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (opts.status) qs.set('status', opts.status);
  if (opts.take !== undefined) qs.set('take', String(opts.take));
  if (opts.skip !== undefined) qs.set('skip', String(opts.skip));
  const q = qs.toString();
  return request<AdminReview[]>(`/admin/reviews${q ? `?${q}` : ''}`);
}

export function adminModerateReview(
  id: string,
  status: Exclude<ReviewStatusValue, 'pending'>,
  note?: string,
) {
  return request<AdminReview>(`/admin/reviews/${id}`, {
    method: 'PATCH',
    body: { status, note },
  });
}

// ── Admin · Job applications ───────────────────────────────────────

export function adminListApplications(opts: {
  status?: JobApplicationStatusValue;
  phone?: string;
  take?: number;
  skip?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (opts.status) qs.set('status', opts.status);
  if (opts.phone) qs.set('phone', opts.phone);
  if (opts.take !== undefined) qs.set('take', String(opts.take));
  if (opts.skip !== undefined) qs.set('skip', String(opts.skip));
  const q = qs.toString();
  return request<AdminApplication[]>(`/admin/applications${q ? `?${q}` : ''}`);
}

export function adminUpdateApplication(
  id: string,
  body: { status?: JobApplicationStatusValue; notes?: string },
) {
  return request<AdminApplication>(`/admin/applications/${id}`, {
    method: 'PATCH',
    body,
  });
}

// ── Admin · Metrics ────────────────────────────────────────────────

export function adminGetMetrics() {
  return request<AdminMetrics>('/admin/metrics');
}

// ── Admin · Settings (director channel) ────────────────────────────

export function adminGetDirectorSettings() {
  return request<DirectorSettings>('/admin/settings/director');
}

export function adminUpdateDirectorSettings(body: Partial<DirectorSettings>) {
  return request<DirectorSettings>('/admin/settings/director', {
    method: 'PATCH',
    body,
  });
}
