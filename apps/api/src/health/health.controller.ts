import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    let db = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    // Return 503 when the DB is unreachable so uptime monitors detect the
    // outage instead of treating a DB-down API as healthy.
    res.status(db === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      uptimeSec: Math.round(process.uptime()),
      db,
      ts: new Date().toISOString(),
    };
  }

  // Liveness: the process is up and serving. Always 200 — used to decide
  // whether the container should be restarted (not whether it's ready).
  @Get('live')
  live() {
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      ts: new Date().toISOString(),
    };
  }

  // Readiness: the process can serve real traffic (DB reachable). 503 when
  // the DB is down so load balancers stop routing to it.
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    let db = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    res.status(db === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: db === 'up' ? 'ready' : 'not_ready',
      db,
      ts: new Date().toISOString(),
    };
  }
}
