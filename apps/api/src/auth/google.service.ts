import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

export interface GoogleIdentity {
  providerUserId: string; // Google "sub" — stable unique id
  email: string;
  name?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  /**
   * Accepted audiences: the web client id plus the native (Android/iOS) client ids.
   * Comma-separated in GOOGLE_CLIENT_IDS, or a single GOOGLE_CLIENT_ID.
   */
  private get audiences(): string[] {
    const raw =
      this.config.get<string>('GOOGLE_CLIENT_IDS') ??
      this.config.get<string>('GOOGLE_CLIENT_ID') ??
      '';
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async verify(idToken: string): Promise<GoogleIdentity> {
    const audience = this.audiences;
    if (audience.length === 0) {
      this.logger.error('GOOGLE_CLIENT_ID(S) not configured — cannot verify Google sign-in');
      throw new UnauthorizedException('Google sign-in is not configured');
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      payload = ticket.getPayload();
    } catch (e) {
      this.logger.warn(`Google ID token verification failed: ${(e as Error).message}`);
      throw new UnauthorizedException('invalid Google token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('invalid Google token');
    }
    if (!payload.email || payload.email_verified === false) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    return {
      providerUserId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name,
    };
  }
}
