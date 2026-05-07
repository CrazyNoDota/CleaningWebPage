import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

  async requestOtp(phone: string) {
    await this.otp.issue(phone);
    return { ok: true, ttlSec: this.otp.ttlSeconds };
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    await this.otp.verify(phone, code);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, name, role: 'client' },
      });
    } else if (name && !user.name) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    return this.tokens.issuePair(user);
  }

  async refresh(rawRefresh: string) {
    return this.tokens.rotate(rawRefresh);
  }

  async logout(rawRefresh: string) {
    await this.tokens.revoke(rawRefresh);
    return { ok: true };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('user not found or inactive');
    }
    return user;
  }
}
