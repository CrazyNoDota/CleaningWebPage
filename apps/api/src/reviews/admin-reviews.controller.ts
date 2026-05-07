import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';

@ApiTags('admin-reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Moderation queue. Defaults to pending; pass ?status= to filter.' })
  list(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: ReviewStatus,
  ) {
    return this.reviews.listModerationQueue({
      take: clamp(intOrDefault(take, 50), 1, 200),
      skip: Math.max(intOrDefault(skip, 0), 0),
      status,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Approve, hide, or reject a review. Cleaner stats reroll.' })
  moderate(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ModerateReviewDto,
  ) {
    return this.reviews.moderate(
      id,
      { userId: req.user!.sub, role: req.user!.role },
      body.status,
      body.note,
    );
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
