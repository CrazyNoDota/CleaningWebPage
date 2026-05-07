import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order. Total is recomputed server-side.' })
  create(@Req() req: Request, @Body() body: CreateOrderDto) {
    return this.orders.create({ userId: req.user!.sub, role: req.user!.role }, body);
  }

  @Get()
  @ApiOperation({ summary: 'List the current user’s orders' })
  list(@Req() req: Request) {
    return this.orders.listForUser(req.user!.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of the current user’s orders, including its event log' })
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.orders.getForUser(id, req.user!.sub);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel one of the current user’s orders (if state allows)' })
  cancel(@Req() req: Request, @Param('id') id: string, @Body() body: CancelOrderDto) {
    return this.orders.cancelByCustomer(id, req.user!.sub, body.reason);
  }
}
