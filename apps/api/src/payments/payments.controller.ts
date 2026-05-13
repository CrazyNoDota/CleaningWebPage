import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('orders/:orderId/payments')
  @ApiOperation({ summary: 'Initiate payment for an order' })
  initiate(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: InitiatePaymentDto,
  ) {
    return this.payments.initiateForOrder(orderId, req.user!.sub, body.idempotencyKey);
  }

  @Post('payments/:paymentId/stub/confirm')
  @ApiOperation({ summary: 'Confirm a stub payment and mark the order paid' })
  confirmStub(@Req() req: Request, @Param('paymentId') paymentId: string) {
    return this.payments.confirmStub(paymentId, req.user!.sub);
  }
}
