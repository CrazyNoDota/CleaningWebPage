import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { UpdateMeDto } from './dto/update-me.dto';

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
