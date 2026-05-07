/**
 * Pricing DSL evaluator.
 *
 * Expressions are stored as JSON in Service.pricingExpr and evaluated server-side.
 * This lets admins edit pricing rules without redeploying the API.
 *
 * Supported nodes:
 *   { op: 'const', value: number }
 *   { op: 'var', name: string }                 — looked up in ctx.vars (e.g. basePrice)
 *   { op: 'input', name: string, default?: n }  — looked up in ctx.inputs (user-supplied)
 *   { op: 'add', args: Expr[] }
 *   { op: 'sub', args: [Expr, Expr] }
 *   { op: 'mul', args: Expr[] }
 *   { op: 'min', args: Expr[] } | { op: 'max', args: Expr[] }
 *   { op: 'sum_options' }                       — sums priceDelta * qty for selected options
 */

export type PriceExpr =
  | { op: 'const'; value: number }
  | { op: 'var'; name: string }
  | { op: 'input'; name: string; default?: number }
  | { op: 'add'; args: PriceExpr[] }
  | { op: 'sub'; args: [PriceExpr, PriceExpr] }
  | { op: 'mul'; args: PriceExpr[] }
  | { op: 'min'; args: PriceExpr[] }
  | { op: 'max'; args: PriceExpr[] }
  | { op: 'sum_options' };

export interface SelectedOption {
  key: string;
  priceDelta: number;
  qty: number;
}

export interface PricingContext {
  vars: Record<string, number>;
  inputs: Record<string, number>;
  options: SelectedOption[];
}

export class PricingError extends Error {
  constructor(message: string) {
    super(`PricingError: ${message}`);
    this.name = 'PricingError';
  }
}

export function evaluate(expr: unknown, ctx: PricingContext): number {
  if (!expr || typeof expr !== 'object' || !('op' in expr)) {
    throw new PricingError(`expected expression object, got ${typeof expr}`);
  }
  const node = expr as PriceExpr;

  switch (node.op) {
    case 'const':
      return assertFinite(node.value, 'const.value');

    case 'var': {
      const v = ctx.vars[node.name];
      if (v === undefined) throw new PricingError(`unknown var "${node.name}"`);
      return assertFinite(v, `var.${node.name}`);
    }

    case 'input': {
      const v = ctx.inputs[node.name];
      if (v === undefined) {
        if (node.default !== undefined) return assertFinite(node.default, `input.${node.name}.default`);
        throw new PricingError(`missing input "${node.name}"`);
      }
      return assertFinite(v, `input.${node.name}`);
    }

    case 'add':
      return assertExprArray(node.args, 'add').reduce((acc, e) => acc + evaluate(e, ctx), 0);

    case 'sub': {
      const args = assertExprArray(node.args, 'sub');
      if (args.length !== 2) throw new PricingError(`sub requires exactly 2 args`);
      return evaluate(args[0]!, ctx) - evaluate(args[1]!, ctx);
    }

    case 'mul':
      return assertExprArray(node.args, 'mul').reduce((acc, e) => acc * evaluate(e, ctx), 1);

    case 'min': {
      const args = assertExprArray(node.args, 'min');
      if (args.length === 0) throw new PricingError(`min requires at least 1 arg`);
      return Math.min(...args.map((e) => evaluate(e, ctx)));
    }

    case 'max': {
      const args = assertExprArray(node.args, 'max');
      if (args.length === 0) throw new PricingError(`max requires at least 1 arg`);
      return Math.max(...args.map((e) => evaluate(e, ctx)));
    }

    case 'sum_options':
      return ctx.options.reduce((acc, o) => acc + o.priceDelta * o.qty, 0);

    default: {
      const exhaustive: never = node;
      throw new PricingError(`unknown op: ${JSON.stringify(exhaustive)}`);
    }
  }
}

function assertFinite(n: unknown, where: string): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new PricingError(`${where} must be a finite number`);
  }
  return n;
}

function assertExprArray(a: unknown, where: string): PriceExpr[] {
  if (!Array.isArray(a)) throw new PricingError(`${where}.args must be an array`);
  return a as PriceExpr[];
}
