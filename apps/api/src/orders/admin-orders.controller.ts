import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { AssignCleanerDto } from './dto/assign-cleaner.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';

@ApiTags('admin-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin', 'operator', 'cleaner')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders with optional filters' })
  list(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: OrderStatus,
    @Query('cleanerId') cleanerId?: string,
    @Query('userPhone') userPhone?: string,
  ) {
    return this.orders.adminList({
      take: clamp(intOrDefault(take, 50), 1, 200),
      skip: Math.max(intOrDefault(skip, 0), 0),
      status,
      cleanerId,
      userPhone,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order with all related data + event log' })
  getOne(@Param('id') id: string) {
    return this.orders.adminGet(id);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a cleaner to the order (manager/admin/operator)' })
  assign(@Req() req: Request, @Param('id') id: string, @Body() body: AssignCleanerDto) {
    return this.orders.assignCleaner(id, body.cleanerId, {
      userId: req.user!.sub,
      role: req.user!.role,
    });
  }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move the order to a new status. State machine validates the edge.',
  })
  transition(@Req() req: Request, @Param('id') id: string, @Body() body: TransitionStatusDto) {
    return this.orders.transitionByOperator(
      id,
      body.to,
      { userId: req.user!.sub, role: req.user!.role },
      body.note,
    );
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function intOrDefault(s: string | undefined, d: number): number {
  if (s === undefined || s === '') return d;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}
