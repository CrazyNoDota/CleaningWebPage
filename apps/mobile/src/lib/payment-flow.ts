import * as WebBrowser from 'expo-web-browser';
import type { Payment } from './types';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60_000;
const TERMINAL_STATUSES: Payment['status'][] = [
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'expired',
];

/**
 * Opens the provider's hosted checkout page in an in-app browser and polls our
 * API for the payment's terminal status. Returns the final payment object.
 * The polling continues even if the user dismisses the browser early — providers
 * may still complete the charge in background and notify via webhook.
 */
export async function openPaymentAndAwait(
  paymentUrl: string,
  paymentId: string,
  fetchStatus: (id: string) => Promise<Payment>,
): Promise<Payment> {
  WebBrowser.openBrowserAsync(paymentUrl).catch(() => undefined);

  const startedAt = Date.now();
  let lastSeen: Payment | null = null;

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    try {
      lastSeen = await fetchStatus(paymentId);
      if (TERMINAL_STATUSES.includes(lastSeen.status)) {
        WebBrowser.dismissBrowser();
        return lastSeen;
      }
    } catch {
      // transient — keep polling
    }
    await sleep(POLL_INTERVAL_MS);
  }

  WebBrowser.dismissBrowser();
  return lastSeen ?? (await fetchStatus(paymentId));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
