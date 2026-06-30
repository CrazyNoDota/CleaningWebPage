import {
  HOME_PLANS_DEFAULTS,
  HOME_PLANS_MAX_PER_GROUP,
  sanitizeHomePlans,
} from './home-plans';

const valid = (over: Record<string, unknown> = {}) => ({
  title: 'Однушка',
  rooms: '1 комната',
  bath: '1 санузел',
  price: 'от 15 000 ₸',
  ...over,
});

describe('sanitizeHomePlans', () => {
  it('coerces a non-object / missing value into two empty groups', () => {
    expect(sanitizeHomePlans(null)).toEqual({ apartment: [], house: [] });
    expect(sanitizeHomePlans(undefined)).toEqual({ apartment: [], house: [] });
    expect(sanitizeHomePlans('nope')).toEqual({ apartment: [], house: [] });
    expect(sanitizeHomePlans({})).toEqual({ apartment: [], house: [] });
  });

  it('treats a non-array group as empty', () => {
    expect(sanitizeHomePlans({ apartment: 'x', house: 42 })).toEqual({
      apartment: [],
      house: [],
    });
  });

  it('keeps a fully-specified plan and trims its fields', () => {
    const out = sanitizeHomePlans({
      apartment: [valid({ key: 'a', title: '  Однушка  ', price: ' от 15 000 ₸ ' })],
      house: [],
    });
    expect(out.apartment).toEqual([
      { key: 'a', title: 'Однушка', rooms: '1 комната', bath: '1 санузел', price: 'от 15 000 ₸' },
    ]);
  });

  it('drops tiles whose required fields are blank or whitespace-only', () => {
    const out = sanitizeHomePlans({
      apartment: [
        valid({ key: 'ok' }),
        valid({ title: '' }), // empty title
        valid({ rooms: '   ' }), // whitespace rooms
        valid({ bath: undefined }), // missing bath
        valid({ price: '' }), // empty price
        { title: 'no others' }, // missing everything else
      ],
      house: [],
    });
    expect(out.apartment.map((p) => p.key)).toEqual(['ok']);
  });

  it('omits an empty/whitespace badge and keeps a real one (trimmed)', () => {
    const out = sanitizeHomePlans({
      apartment: [valid({ key: 'a', badge: '  ' }), valid({ key: 'b', badge: '  TOP ' })],
      house: [],
    });
    expect(out.apartment[0]).not.toHaveProperty('badge');
    expect(out.apartment[1].badge).toBe('TOP');
  });

  it('backfills missing keys without colliding with an explicit numeric key', () => {
    const out = sanitizeHomePlans({
      apartment: [valid({ key: '0' }), valid(), valid()], // 2nd & 3rd have no key
      house: [],
    });
    const keys = out.apartment.map((p) => p.key);
    expect(keys[0]).toBe('0');
    expect(new Set(keys).size).toBe(keys.length); // all unique
  });

  it('repairs duplicate explicit keys so every key is unique', () => {
    const out = sanitizeHomePlans({
      apartment: [valid({ key: 'dup' }), valid({ key: 'dup' })],
      house: [],
    });
    const keys = out.apartment.map((p) => p.key);
    expect(new Set(keys).size).toBe(2);
  });

  it('caps each group at HOME_PLANS_MAX_PER_GROUP', () => {
    const many = Array.from({ length: HOME_PLANS_MAX_PER_GROUP + 4 }, (_, i) =>
      valid({ key: `k${i}` }),
    );
    const out = sanitizeHomePlans({ apartment: many, house: many });
    expect(out.apartment).toHaveLength(HOME_PLANS_MAX_PER_GROUP);
    expect(out.house).toHaveLength(HOME_PLANS_MAX_PER_GROUP);
  });

  it('round-trips the shipped defaults unchanged', () => {
    expect(sanitizeHomePlans(HOME_PLANS_DEFAULTS)).toEqual(HOME_PLANS_DEFAULTS);
  });
});
