import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobApplication, JobApplicationStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { SubmitApplicationDto } from './dto/submit-application.dto';
import type { UpdateApplicationDto } from './dto/update-application.dto';

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ApplicationsService {
  private readonly log = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(dto: SubmitApplicationDto): Promise<JobApplication> {
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);
    const recent = await this.prisma.jobApplication.findFirst({
      where: { phone: dto.phone, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) {
      throw new ConflictException(
        'an application from this phone was already submitted in the last 24 hours',
      );
    }

    let cityId: string | null = null;
    if (dto.city) {
      const city = await this.prisma.city.findUnique({
        where: { slug: dto.city },
        select: { id: true },
      });
      cityId = city?.id ?? null;
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        cityId,
        cityFreeText: cityId ? null : dto.cityFreeText ?? dto.city ?? null,
        age: dto.age,
        experience: dto.experience,
        source: dto.source ?? 'web',
        resumeUrl: dto.resumeUrl ?? null,
      },
      include: { city: true },
    });

    // Fan-out notification to all manager + admin users.
    void this.notifyOps(application).catch((err) => {
      this.log.warn(`ops notify failed: ${err instanceof Error ? err.message : err}`);
    });

    return application;
  }

  async list(opts: {
    take: number;
    skip: number;
    status?: JobApplicationStatus;
    phone?: string;
  }): Promise<JobApplication[]> {
    return this.prisma.jobApplication.findMany({
      where: {
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.phone ? { phone: opts.phone } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: opts.take,
      skip: opts.skip,
      include: { city: true },
    });
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<JobApplication> {
    const existing = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`application "${id}" not found`);
    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { city: true },
    });
  }

  // ── private ───────────────────────────────────────────────────────

  private async notifyOps(application: JobApplication & { city: { slug: string } | null }) {
    const ops = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.manager, UserRole.admin] },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (ops.length === 0) {
      this.log.warn('no manager/admin users to notify about new application');
      return;
    }

    const cityLabel =
      application.city?.slug ?? application.cityFreeText ?? 'unknown';

    await Promise.all(
      ops.map((u) =>
        this.notifications.dispatchToUser({
          userId: u.id,
          kind: 'application.received',
          ctx: {
            fullName: application.fullName,
            phone: application.phone,
            city: cityLabel,
          },
          payload: {
            applicationId: application.id,
            phone: application.phone,
          } as unknown as Prisma.InputJsonValue,
        }),
      ),
    );
  }
}
