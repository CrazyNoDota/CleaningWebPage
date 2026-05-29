import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments/webhooks')
export class PaymentWebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':provider')
  @ApiOperation({
    summary: 'Provider callback endpoint (HMAC/JWT-signed). Public route.',
  })
  async receive(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody ?? Buffer.from('');
    return this.payments.handleWebhook(provider, headers, rawBody, body);
  }
}
