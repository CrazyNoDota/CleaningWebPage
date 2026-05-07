import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('orders/:id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review for one of the current user’s done orders' })
  submit(@Req() req: Request, @Param('id') orderId: string, @Body() body: CreateReviewDto) {
    return this.reviews.submitForOrder(
      orderId,
      { userId: req.user!.sub, role: req.user!.role },
      body,
    );
  }

  @Get('cleaners/:id/reviews')
  @ApiOperation({ summary: 'Public published reviews for a cleaner (paginated)' })
  listForCleaner(
    @Param('id') cleanerId: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.reviews.listForCleaner(cleanerId, {
      take: clamp(intOrDefault(take, 20), 1, 100),
      skip: Math.max(intOrDefault(skip, 0), 0),
    });
  }

  @Get('reviews/aggregate')
  @ApiOperation({ summary: 'Company-wide rating aggregate across all published reviews' })
  aggregate() {
    return this.reviews.aggregate();
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function intOrDefault(s: string | undefined, d: number): number {
  if (s === undefined || s === '') return d;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}
