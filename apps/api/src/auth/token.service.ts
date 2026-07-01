import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: { id: string; phone: string | null; name: string | null; role: string; locale: string };
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issuePair(user: User): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });

    const rawRefresh = randomBytes(48).toString('base64url');
    const tokenHash = this.hashRefresh(rawRefresh);
    const ttlDays = this.parseDays(this.config.get<string>('JWT_REFRESH_TTL') ?? '30d');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        locale: user.locale,
      },
    };
  }

  async rotate(rawRefresh: string): Promise<TokenPair> {
    const tokenHash = this.hashRefresh(rawRefresh);
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!record) throw new UnauthorizedException('invalid refresh token');

    // Deny rotation for deactivated or soft-deleted users: a disabled account
    // must not keep minting access tokens for the lifetime of its refresh token.
    // Revoke the presented token as well so it stops looking valid.
    if (!record.user.isActive || record.user.deletedAt !== null) {
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('user is not active');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    // issuePair re-stamps the role from the current DB user record, so a demoted
    // user loses their elevated role on the next refresh.
    return this.issuePair(record.user);
  }

  async revoke(rawRefresh: string): Promise<void> {
    const tokenHash = this.hashRefresh(rawRefresh);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes every active refresh token for a user. Call this when an account is
   * deactivated or soft-deleted so existing sessions can no longer be refreshed.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashRefresh(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseDays(ttl: string): number {
    const m = /^(\d+)d$/.exec(ttl);
    if (!m || !m[1]) return 30;
    return Number(m[1]);
  }
}
