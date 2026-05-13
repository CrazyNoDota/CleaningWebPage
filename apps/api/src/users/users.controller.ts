import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { DeviceTokenDto } from './dto/device-token.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.auth.getUserById(req.user!.sub);
    return this.publicView(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile fields, locale, notification preferences' })
  async updateMe(@Req() req: Request, @Body() body: UpdateMeDto) {
    const updated = await this.prisma.user.update({
      where: { id: req.user!.sub },
      data: body,
    });
    return this.publicView(updated);
  }

  @Post('me/device-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a mobile push token for the current user' })
  async registerDeviceToken(@Req() req: Request, @Body() body: DeviceTokenDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: req.user!.sub },
      select: { deviceTokens: true },
    });
    const deviceTokens = Array.from(new Set([body.token, ...user.deviceTokens])).slice(0, 10);
    await this.prisma.user.update({
      where: { id: req.user!.sub },
      data: { deviceTokens },
    });
    return { registered: true };
  }

  @Delete('me/device-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a mobile push token from the current user' })
  async unregisterDeviceToken(@Req() req: Request, @Body() body: DeviceTokenDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: req.user!.sub },
      select: { deviceTokens: true },
    });
    await this.prisma.user.update({
      where: { id: req.user!.sub },
      data: { deviceTokens: user.deviceTokens.filter((token) => token !== body.token) },
    });
    return { registered: false };
  }

  private publicView(u: {
    id: string;
    phone: string | null;
    email: string | null;
    name: string | null;
    role: string;
    locale: string;
    notificationChannels: string[];
    telegramChatId: string | null;
  }) {
    return {
      id: u.id,
      phone: u.phone,
      email: u.email,
      name: u.name,
      role: u.role,
      locale: u.locale,
      notificationChannels: u.notificationChannels,
      telegramChatId: u.telegramChatId,
    };
  }
}
