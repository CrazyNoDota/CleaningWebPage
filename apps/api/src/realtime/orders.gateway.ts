import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt-auth.guard';
import {
  ORDER_STATE_CHANGED,
  type OrderStateChangedEvent,
} from './domain-events';

const PRIVILEGED_ROLES = new Set(['manager', 'admin', 'operator']);

interface SubscribePayload {
  orderId: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger(OrdersGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.emit('error', { message: 'missing token' });
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
      this.log.debug(`connected sub=${payload.sub} role=${payload.role}`);
    } catch {
      client.emit('error', { message: 'invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const u = client.data?.user as JwtPayload | undefined;
    if (u) this.log.debug(`disconnected sub=${u.sub}`);
  }

  @SubscribeMessage('subscribe-order')
  async onSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SubscribePayload,
  ) {
    const user = client.data.user as JwtPayload | undefined;
    if (!user) return { ok: false, error: 'unauthenticated' };
    if (!body?.orderId) return { ok: false, error: 'orderId required' };

    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
      select: { id: true, userId: true, cleanerId: true, status: true },
    });
    if (!order) return { ok: false, error: 'not_found' };

    const allowed =
      order.userId === user.sub ||
      PRIVILEGED_ROLES.has(user.role) ||
      // cleaners can subscribe to orders assigned to them (matches by cleaner.userId)
      (user.role === 'cleaner' && (await this.isCleanerAssigned(order.cleanerId, user.sub)));

    if (!allowed) return { ok: false, error: 'forbidden' };

    await client.join(roomOf(order.id));
    return { ok: true, currentStatus: order.status };
  }

  @SubscribeMessage('unsubscribe-order')
  async onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SubscribePayload,
  ) {
    if (body?.orderId) await client.leave(roomOf(body.orderId));
    return { ok: true };
  }

  // ── domain event listener ────────────────────────────────────────

  @OnEvent(ORDER_STATE_CHANGED)
  onOrderStateChanged(evt: OrderStateChangedEvent) {
    this.server.to(roomOf(evt.orderId)).emit('order.updated', {
      orderId: evt.orderId,
      status: evt.status,
      previousStatus: evt.previousStatus,
      eventType: evt.eventType,
      at: evt.at,
    });
  }

  // ── helpers ──────────────────────────────────────────────────────

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) return auth.token;
    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') return queryToken;
    return undefined;
  }

  private async isCleanerAssigned(cleanerId: string | null, userId: string): Promise<boolean> {
    if (!cleanerId) return false;
    const c = await this.prisma.cleaner.findUnique({
      where: { id: cleanerId },
      select: { userId: true },
    });
    return c?.userId === userId;
  }
}

function roomOf(orderId: string): string {
  return `order:${orderId}`;
}
