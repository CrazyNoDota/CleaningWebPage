import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

class BroadcastDto {
  @IsString() @MinLength(1) @MaxLength(120) title!: string;
  @IsString() @MinLength(1) @MaxLength(500) body!: string;
  // Audience: everyone with a device, only users who have placed an order, or a
  // single user matched by phone (when `phone` is set, segment is ignored).
  @IsIn(['all', 'has_orders']) segment!: 'all' | 'has_orders';
  @IsOptional() @Matches(/^\+7\d{10}$/, { message: 'phone must be +7XXXXXXXXXX' })
  phone?: string;
}

@ApiTags('admin-notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent broadcast campaigns (grouped)' })
  list() {
    return this.notifications.listBroadcasts();
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Send a push broadcast to an audience of app users' })
  broadcast(@Body() dto: BroadcastDto) {
    return this.notifications.broadcastPush(dto);
  }
}
