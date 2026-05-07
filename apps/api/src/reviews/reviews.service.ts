import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, Prisma, Review, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ORDER_STATE_CHANGED,
  type OrderStateChangedEvent,
} from '../realtime/domain-events';
import type { CreateReviewDto } from './dto/create-review.dto';
import { addRating, removeRating } from './running-stats';

interface ActorContext {
  userId: string;
  role: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  private get autoPublish(): boolean {
    return this.config.get<string>('REVIEWS_AUTO_PUBLISH', 'true').toLowerCase() === 'true';
  }

  async submitForOrder(orderId: string, actor: ActorContext, dto: CreateReviewDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== actor.userId) {
        // Same shape as missing — don't leak existence
        throw new NotFoundException(`order "${orderId}" not found`);
      }
      if (order.status !== OrderStatus.done) {
        throw new BadRequestException(
          `order must be in status "done" to be reviewed (current: "${order.status}")`,
        );
      }
      const existing = await tx.review.findUnique({ where: { orderId } });
      if (existing) {
        throw new ConflictException('review already submitted for this order');
      }

      const status = this.autoPublish ? ReviewStatus.published : ReviewStatus.pending;
      const publishedAt = status === ReviewStatus.published ? new Date() : null;

      const review = await tx.review.create({
        data: {
          orderId,
          userId: actor.userId,
          cleanerId: order.cleanerId,
          rating: dto.rating,
          comment: dto.comment,
          tags: dto.tags ?? [],
          photos: dto.photos ?? [],
          status,
          publishedAt,
        },
      });

      // Advance the order to `reviewed` regardless of moderation status —
      // the customer DID submit, even if it's not yet visible.
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.reviewed },
      });
      await tx.orderEvent.create({
        data: {
          orderId,
          type: 'order.reviewed',
          actorId: actor.userId,
          payload: { reviewId: review.id, autoPublished: this.autoPublish },
        },
      });

      // Stats only update for currently-published reviews.
      if (status === ReviewStatus.published && order.cleanerId) {
        await this.bumpCleanerStats(tx, order.cleanerId, dto.rating, 'add');
      }

      return { review, order };
    });

    // Push order.reviewed to subscribed clients now that the txn has committed.
    const evt: OrderStateChangedEvent = {
      orderId: result.order.id,
      userId: result.order.userId,
      cleanerId: result.order.cleanerId,
      status: OrderStatus.reviewed,
      previousStatus: OrderStatus.done,
      eventType: 'order.reviewed',
      at: new Date(),
    };
    this.events.emit(ORDER_STATE_CHANGED, evt);

    return this.publicView(result.review);
  }

  async listForCleaner(cleanerId: string, opts: { take: number; skip: number }) {
    const cleaner = await this.prisma.cleaner.findUnique({
      where: { id: cleanerId },
      select: { id: true, isActive: true },
    });
    if (!cleaner || !cleaner.isActive) {
      throw new NotFoundException(`cleaner "${cleanerId}" not found`);
    }
    const reviews = await this.prisma.review.findMany({
      where: { cleanerId, status: ReviewStatus.published },
      orderBy: { publishedAt: 'desc' },
      take: opts.take,
      skip: opts.skip,
    });
    return reviews.map((r) => this.publicView(r));
  }

  async aggregate() {
    // Company-wide rolling rating across all published reviews.
    const agg = await this.prisma.review.aggregate({
      where: { status: ReviewStatus.published },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count._all,
    };
  }

  async listModerationQueue(opts: { take: number; skip: number; status?: ReviewStatus }) {
    return this.prisma.review.findMany({
      where: { status: opts.status ?? ReviewStatus.pending },
      orderBy: { createdAt: 'asc' },
      take: opts.take,
      skip: opts.skip,
    });
  }

  async moderate(
    reviewId: string,
    actor: ActorContext,
    next: ReviewStatus,
    note?: string,
  ) {
    if (next === ReviewStatus.pending) {
      throw new BadRequestException('cannot moderate to "pending"');
    }
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id: reviewId } });
      if (!review) throw new NotFoundException(`review "${reviewId}" not found`);
      if (review.status === next) {
        return this.publicView(review);
      }

      const wasPublished = review.status === ReviewStatus.published;
      const willBePublished = next === ReviewStatus.published;

      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: next,
          publishedAt: willBePublished
            ? review.publishedAt ?? new Date()
            : review.publishedAt,
          moderatedById: actor.userId,
          moderationNote: note,
        },
      });

      if (review.cleanerId) {
        if (!wasPublished && willBePublished) {
          await this.bumpCleanerStats(tx, review.cleanerId, review.rating, 'add');
        } else if (wasPublished && !willBePublished) {
          await this.bumpCleanerStats(tx, review.cleanerId, review.rating, 'remove');
        }
      }

      return this.publicView(updated);
    });
  }

  // ── private ───────────────────────────────────────────────────────

  private async bumpCleanerStats(
    tx: Prisma.TransactionClient,
    cleanerId: string,
    rating: number,
    direction: 'add' | 'remove',
  ) {
    const c = await tx.cleaner.findUnique({
      where: { id: cleanerId },
      select: { ratingAvg: true, ratingCount: true },
    });
    if (!c) return;
    const next =
      direction === 'add'
        ? addRating(c.ratingAvg, c.ratingCount, rating)
        : removeRating(c.ratingAvg, c.ratingCount, rating);
    await tx.cleaner.update({
      where: { id: cleanerId },
      data: { ratingAvg: next.avg, ratingCount: next.count },
    });
  }

  private publicView(r: Review) {
    return {
      id: r.id,
      orderId: r.orderId,
      cleanerId: r.cleanerId,
      rating: r.rating,
      comment: r.comment,
      tags: r.tags,
      photos: r.photos,
      status: r.status,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
    };
  }
}
