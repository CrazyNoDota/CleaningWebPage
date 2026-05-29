import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as admin from 'firebase-admin';
import type {
  ChannelDispatchResult,
  ChannelMessage,
  NotificationChannelDriver,
} from './types';

/** Thrown when FCM rejects a token as unregistered/invalid so the caller can prune it. */
export class DeadDeviceTokenError extends Error {
  constructor(
    public readonly token: string,
    message: string,
  ) {
    super(message);
    this.name = 'DeadDeviceTokenError';
  }
}

const DEAD_TOKEN_FCM_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * Sends push notifications directly via Firebase Cloud Messaging.
 * Recipients are native FCM registration tokens obtained on the mobile client
 * via expo-notifications' getDevicePushTokenAsync().
 *
 * Credentials are loaded from:
 *  1. FIREBASE_SERVICE_ACCOUNT_JSON env var (raw JSON or base64-encoded JSON)
 *  2. firebase-service-account.json next to the api package (gitignored)
 */
@Injectable()
export class FcmChannel implements NotificationChannelDriver, OnModuleInit {
  readonly channel = NotificationChannel.push;
  private readonly log = new Logger('FCM');
  private app: admin.app.App | null = null;

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.app = admin.apps[0]!;
      return;
    }

    const credential = this.loadCredential();
    if (!credential) {
      this.log.warn(
        'FCM credentials not configured — push notifications will be skipped',
      );
      return;
    }

    this.app = admin.initializeApp({ credential });
    this.log.log('Firebase Admin initialized for FCM');
  }

  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    if (!this.app) throw new Error('FCM not initialized (missing credentials)');

    try {
      const messageId = await admin.messaging(this.app).send({
        token: msg.recipient,
        notification: {
          title: msg.subject ?? undefined,
          body: msg.body,
        },
        android: {
          priority: 'high',
          notification: { channelId: 'orders', sound: 'default' },
        },
        apns: {
          payload: { aps: { sound: 'default' } },
        },
      });
      this.log.debug(`fcm sent id=${messageId} to ${msg.recipient.slice(0, 12)}…`);
      return { recipient: msg.recipient, delivered: true };
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
          ? err.code
          : '';
      if (DEAD_TOKEN_FCM_CODES.has(code)) {
        throw new DeadDeviceTokenError(msg.recipient, `fcm rejected token: ${code}`);
      }
      throw err;
    }
  }

  resolveRecipient(u: { deviceTokens: string[] }): string | null {
    // First non-Expo token wins (native FCM tokens are raw base64/colon strings,
    // ExponentPushToken[...] entries from prior builds are ignored).
    return (
      u.deviceTokens.find(
        (t) => !t.startsWith('ExponentPushToken[') && !t.startsWith('ExpoPushToken['),
      ) ?? null
    );
  }

  private loadCredential(): admin.credential.Credential | null {
    const envValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (envValue) {
      const raw = envValue.trim().startsWith('{')
        ? envValue
        : Buffer.from(envValue, 'base64').toString('utf8');
      try {
        const parsed = JSON.parse(raw);
        return admin.credential.cert(parsed);
      } catch (err) {
        this.log.error(
          `failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return null;
      }
    }

    const localPath = path.resolve(
      process.cwd(),
      'apps/api/firebase-service-account.json',
    );
    const fallbackPath = path.resolve(__dirname, '../../../firebase-service-account.json');

    for (const p of [localPath, fallbackPath]) {
      if (fs.existsSync(p)) {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
        return admin.credential.cert(parsed);
      }
    }
    return null;
  }
}
