import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    private readonly google: GoogleAuthService,
  ) {}

  async adminLogin(login: string, password: string) {
    const expectedLogin = this.config.get<string>('ADMIN_LOGIN');
    const expectedPassword = this.config.get<string>('ADMIN_PASSWORD');
    if (!expectedLogin || !expectedPassword) {
      throw new UnauthorizedException('admin login is not configured');
    }
    if (login !== expectedLogin || password !== expectedPassword) {
      throw new UnauthorizedException('invalid credentials');
    }

    let user = await this.prisma.user.findUnique({ where: { email: login } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: login, name: login, role: 'admin' },
      });
    } else if (user.role !== 'admin' && user.role !== 'manager') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' },
      });
    }

    return this.tokens.issuePair(user);
  }

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

  /**
   * Sign in with Google. Verifies the ID token issued by Google on the client,
   * then finds-or-creates the user and links an OAuthAccount(provider=google).
   * Links to an existing user when the verified email already matches one.
   */
  async googleLogin(idToken: string) {
    const identity = await this.google.verify(idToken);

    // 1. Already linked? Use that user.
    const existingLink = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: identity.providerUserId,
        },
      },
      include: { user: true },
    });
    if (existingLink) {
      return this.tokens.issuePair(existingLink.user);
    }

    // 2. No link yet — match by verified email, or create a new client.
    let user = await this.prisma.user.findUnique({ where: { email: identity.email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: identity.email, name: identity.name, role: 'client' },
      });
    } else if (identity.name && !user.name) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name: identity.name },
      });
    }

    await this.prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: 'google',
        providerUserId: identity.providerUserId,
      },
    });

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
