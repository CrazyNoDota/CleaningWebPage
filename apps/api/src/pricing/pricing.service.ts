import { BadRequestException, Injectable } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { evaluate, PricingError, type SelectedOption } from './pricing-engine';
import type { QuoteDto } from './dto/quote.dto';

export interface QuoteResult {
  serviceSlug: string;
  currency: string;
  basePrice: number;
  options: { key: string; qty: number; lineTotal: number }[];
  total: number;
}

@Injectable()
export class PricingService {
  constructor(private readonly catalog: CatalogService) {}

  async quote(input: QuoteDto): Promise<QuoteResult> {
    const service = await this.catalog.getServiceRawBySlug(input.serviceSlug);

    const optionMap = new Map(service.options.map((o) => [o.key, o]));
    const selected: SelectedOption[] = [];
    for (const req of input.options ?? []) {
      const opt = optionMap.get(req.key);
      if (!opt) throw new BadRequestException(`unknown option "${req.key}" for service ${input.serviceSlug}`);
      const qty = req.qty ?? 1;
      if (qty < 0) throw new BadRequestException(`option "${req.key}" qty must be >= 0`);
      selected.push({ key: opt.key, priceDelta: opt.priceDelta, qty });
    }

    let total: number;
    try {
      total = evaluate(service.pricingExpr, {
        vars: { basePrice: service.basePrice },
        inputs: this.sanitizeInputs(input.inputs),
        options: selected,
      });
    } catch (err) {
      if (err instanceof PricingError) throw new BadRequestException(err.message);
      throw err;
    }

    if (!Number.isFinite(total) || total < 0) {
      throw new BadRequestException(`computed total is invalid: ${total}`);
    }

    return {
      serviceSlug: service.slug,
      currency: service.currency,
      basePrice: service.basePrice,
      options: selected.map((o) => ({ key: o.key, qty: o.qty, lineTotal: o.priceDelta * o.qty })),
      total: Math.round(total),
    };
  }

  private sanitizeInputs(raw: Record<string, unknown>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw ?? {})) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
      else if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) out[k] = Number(v);
      else throw new BadRequestException(`input "${k}" must be a finite number`);
    }
    return out;
  }
}
