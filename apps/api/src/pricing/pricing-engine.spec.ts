import { evaluate, PricingError, type PriceExpr } from './pricing-engine';

describe('pricing-engine', () => {
  const baseCtx = { vars: { basePrice: 5000_00 }, inputs: {}, options: [] };

  it('evaluates constants', () => {
    expect(evaluate({ op: 'const', value: 42 }, baseCtx)).toBe(42);
  });

  it('looks up vars and inputs', () => {
    expect(evaluate({ op: 'var', name: 'basePrice' }, baseCtx)).toBe(5000_00);
    expect(
      evaluate(
        { op: 'input', name: 'rooms' },
        { ...baseCtx, inputs: { rooms: 3 } },
      ),
    ).toBe(3);
  });

  it('uses default when input is missing', () => {
    expect(evaluate({ op: 'input', name: 'rooms', default: 1 }, baseCtx)).toBe(1);
  });

  it('throws on missing input without default', () => {
    expect(() => evaluate({ op: 'input', name: 'rooms' }, baseCtx)).toThrow(PricingError);
  });

  it('adds and multiplies', () => {
    const expr: PriceExpr = {
      op: 'add',
      args: [
        { op: 'const', value: 10 },
        { op: 'mul', args: [{ op: 'const', value: 3 }, { op: 'const', value: 4 }] },
      ],
    };
    expect(evaluate(expr, baseCtx)).toBe(22);
  });

  it('sums selected options', () => {
    expect(
      evaluate(
        { op: 'sum_options' },
        {
          ...baseCtx,
          options: [
            { key: 'windows', priceDelta: 3000_00, qty: 1 },
            { key: 'carpet', priceDelta: 4500_00, qty: 2 },
          ],
        },
      ),
    ).toBe(3000_00 + 4500_00 * 2);
  });

  it('evaluates the seeded apartment formula', () => {
    // seed: basePrice + area*250_00 + rooms*1500_00 + sum_options
    const formula: PriceExpr = {
      op: 'add',
      args: [
        { op: 'var', name: 'basePrice' },
        { op: 'mul', args: [{ op: 'input', name: 'area_m2', default: 0 }, { op: 'const', value: 250_00 }] },
        { op: 'mul', args: [{ op: 'input', name: 'rooms', default: 0 }, { op: 'const', value: 1500_00 }] },
        { op: 'sum_options' },
      ],
    };
    const ctx = {
      vars: { basePrice: 5000_00 },
      inputs: { area_m2: 60, rooms: 2 },
      options: [{ key: 'windows', priceDelta: 3000_00, qty: 1 }],
    };
    // 5000_00 + 60*250_00 + 2*1500_00 + 3000_00 = 500000 + 1500000 + 300000 + 300000 = 2_600_000
    expect(evaluate(formula, ctx)).toBe(2_600_000);
  });
});
