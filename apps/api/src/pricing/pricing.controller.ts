import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { QuoteDto } from './dto/quote.dto';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compute a quote for a service with user-supplied inputs and add-on options',
  })
  quote(@Body() body: QuoteDto) {
    return this.pricing.quote(body);
  }
}
