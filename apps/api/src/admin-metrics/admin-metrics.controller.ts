import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  JobApplicationStatus,
  OrderStatus,
  ReviewStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';

@ApiTags('admin-metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin')
@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary:
      'Dashboard counters: today\'s orders, active cleaners, pending reviews, pending applications',
  })
  async metrics() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [ordersToday, activeCleaners, pendingReviews, pendingApplications] =
      await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: { gte: start, lt: end },
            status: { not: OrderStatus.draft },
          },
        }),
        this.prisma.cleaner.count({ where: { isActive: true } }),
        this.prisma.review.count({ where: { status: ReviewStatus.pending } }),
        this.prisma.jobApplication.count({
          where: { status: JobApplicationStatus.new },
        }),
      ]);

    return {
      ordersToday,
      activeCleaners,
      pendingReviews,
      pendingApplications,
      generatedAt: new Date().toISOString(),
    };
  }
}
