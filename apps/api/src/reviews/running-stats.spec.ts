import { addRating, removeRating } from './running-stats';

describe('runningStats', () => {
  it('addRating from zero', () => {
    const r = addRating(0, 0, 5);
    expect(r).toEqual({ avg: 5, count: 1 });
  });

  it('addRating preserves the running mean', () => {
    let s = { avg: 0, count: 0 };
    for (const r of [5, 4, 5, 3, 5]) {
      const next = addRating(s.avg, s.count, r);
      s = next;
    }
    expect(s.count).toBe(5);
    expect(s.avg).toBeCloseTo(4.4, 5);
  });

  it('removeRating undoes addRating exactly', () => {
    const start = { avg: 4.5, count: 10 };
    const after = addRating(start.avg, start.count, 3);
    const back = removeRating(after.avg, after.count, 3);
    expect(back.count).toBe(start.count);
    expect(back.avg).toBeCloseTo(start.avg, 10);
  });

  it('removeRating last review resets to zero', () => {
    const r = removeRating(4.2, 1, 4);
    expect(r).toEqual({ avg: 0, count: 0 });
  });

  it('removeRating below zero clamps to zero', () => {
    const r = removeRating(0, 0, 5);
    expect(r).toEqual({ avg: 0, count: 0 });
  });
});
