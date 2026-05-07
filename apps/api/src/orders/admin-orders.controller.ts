import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
