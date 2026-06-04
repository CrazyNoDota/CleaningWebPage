import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../notifications/sms/sms.service';

const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {}

  get ttlSeconds(): number {
    return Number(this.config.get<string>('OTP_TTL_SECONDS') ?? 300);
  }

  get codeLength(): number {
    return Number(this.config.get<string>('OTP_LENGTH') ?? 6);
  }

  get devMode(): boolean {
    return (this.config.get<string>('OTP_DEV_MODE') ?? 'true') === 'true';
  }

  private isReviewAccount(phone: string): boolean {
    const reviewPhone = this.config.get<string>('REVIEW_PHONE');
    const reviewOtp = this.config.get<string>('REVIEW_OTP');
    return Boolean(reviewPhone && reviewOtp && phone === reviewPhone);
  }

  async issue(phone: string): Promise<void> {
    // Google Play / App Store review account — skip SMS, fixed code is accepted in verify().
    if (this.isReviewAccount(phone)) {
      this.logger.warn(`[REVIEW-OTP] short-circuit issue for ${phone}`);
      return;
    }

    const code = this.generateCode();
    const codeHash = await argon2.hash(code, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    // Invalidate any unconsumed codes for this phone.
    await this.prisma.otpCode.updateMany({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });

    await this.prisma.otpCode.create({
      data: { phone, codeHash, expiresAt },
    });

    if (this.devMode) {
      // In dev we log the code so devs can sign in without an SMS gateway.
      this.logger.warn(`[DEV-OTP] phone=${phone} code=${code}`);
    }

    try {
      await this.sms.send(phone, `Shinex: ваш код ${code}. Срок ${this.ttlSeconds / 60} мин.`);
    } catch (err) {
      // SMS delivery failed (e.g. KZ alpha-name still under moderation at the gateway).
      // Surface a clean 503 with a user-facing message instead of leaking a 500
      // "Internal server error" to the website.
      this.logger.error(
        `Failed to deliver OTP SMS to ${phone}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new ServiceUnavailableException(
        'Не удалось отправить SMS с кодом. Попробуйте позже или свяжитесь с поддержкой.',
      );
    }
  }

  async verify(phone: string, code: string): Promise<void> {
    if (this.isReviewAccount(phone)) {
      const reviewOtp = this.config.get<string>('REVIEW_OTP');
      if (code !== reviewOtp) {
        throw new UnauthorizedException('invalid code');
      }
      this.logger.warn(`[REVIEW-OTP] accepted fixed code for ${phone}`);
      return;
    }

    const record = await this.prisma.otpCode.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('no active OTP for this phone');
    }
    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new UnauthorizedException('too many attempts, request a new code');
    }

    const ok = await argon2.verify(record.codeHash, code);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('invalid code');
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }

  private generateCode(): string {
    const len = this.codeLength;
    const min = 10 ** (len - 1);
    const max = 10 ** len;
    return String(randomInt(min, max));
  }
}
