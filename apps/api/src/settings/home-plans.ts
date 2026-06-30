// ── Home "quick plan" tiles ─────────────────────────────────────────────
// The property-size presets shown at the top of the mobile home screen
// (Квартира / Частный дом). Stored as JSON in the `Setting` table under the
// `home_plans` key and editable from admin without a redeploy.
//
// This module is pure (no Nest/Prisma) so the sanitization rules can be
// unit-tested directly — mirrors `telegram/cleaner-actions.ts`.

export type HomePlanGroup = 'apartment' | 'house';

export interface HomePlan {
  key: string; // stable id, unique within its group
  title: string; // e.g. "Однушка"
  rooms: string; // e.g. "1 комната"
  bath: string; // e.g. "1 санузел"
  price: string; // free text, e.g. "от 15 000 ₸"
  badge?: string; // optional ribbon, e.g. "TOP"
}

export type HomePlans = Record<HomePlanGroup, HomePlan[]>;

// Input shape accepted from admin — `key` may be omitted (it is backfilled
// during sanitization).
export type HomePlanInput = Omit<HomePlan, 'key'> & { key?: string };
export type HomePlansInput = Record<HomePlanGroup, HomePlanInput[]>;

export const HOME_PLANS_KEY = 'home_plans';

// Hard cap per group — keeps the mobile home row from overflowing and bounds
// the stored payload regardless of what the admin (or a crafted request) sends.
export const HOME_PLANS_MAX_PER_GROUP = 6;

export const HOME_PLANS_DEFAULTS: HomePlans = {
  apartment: [
    { key: '1k', title: 'Однушка', rooms: '1 комната', bath: '1 санузел', price: 'от 15 000 ₸' },
    { key: '2k', title: 'Двушка', rooms: '2 комнаты', bath: '1 санузел', price: 'от 19 000 ₸', badge: 'TOP' },
    { key: '3k', title: 'Трешка', rooms: '3 комнаты', bath: '1 санузел', price: 'от 23 000 ₸' },
  ],
  house: [
    { key: 's', title: 'Малый', rooms: 'до 100 м²', bath: '1–2 с/у', price: 'от 28 000 ₸' },
    { key: 'm', title: 'Средний', rooms: '100–200 м²', bath: '2 с/у', price: 'от 42 000 ₸', badge: 'TOP' },
    { key: 'l', title: 'Большой', rooms: '200+ м²', bath: '2–3 с/у', price: 'от 65 000 ₸' },
  ],
};

function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Coerce an unknown value into a clean list of plans:
 * - drops anything that isn't an object or is missing a required field
 *   (empty / whitespace-only title, rooms, bath or price → dropped, so a blank
 *   tile can never reach the app),
 * - trims every field and omits an empty badge,
 * - backfills/repairs keys so every tile has a unique key within the group,
 * - caps the list at HOME_PLANS_MAX_PER_GROUP.
 */
function sanitizePlanList(value: unknown): HomePlan[] {
  if (!Array.isArray(value)) return [];
  const out: HomePlan[] = [];
  const usedKeys = new Set<string>();
  for (const raw of value) {
    if (out.length >= HOME_PLANS_MAX_PER_GROUP) break;
    const p = (raw ?? {}) as Partial<HomePlan>;
    const title = trimmed(p.title);
    const rooms = trimmed(p.rooms);
    const bath = trimmed(p.bath);
    const price = trimmed(p.price);
    if (!title || !rooms || !bath || !price) continue;

    let key = trimmed(p.key);
    if (!key || usedKeys.has(key)) {
      let n = out.length;
      key = `t${n}`;
      while (usedKeys.has(key)) key = `t${++n}`;
    }
    usedKeys.add(key);

    const badge = trimmed(p.badge);
    out.push({ key, title, rooms, bath, price, ...(badge ? { badge } : {}) });
  }
  return out;
}

/** Normalize an arbitrary value into a valid HomePlans object (both groups). */
export function sanitizeHomePlans(value: unknown): HomePlans {
  const v = (value ?? {}) as Partial<HomePlansInput>;
  return {
    apartment: sanitizePlanList(v.apartment),
    house: sanitizePlanList(v.house),
  };
}
