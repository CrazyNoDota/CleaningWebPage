import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobApplicationStatus } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';

@ApiTags('admin-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin')
@Controller('admin/applications')
export class AdminApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List job applications. Filter by status / phone.' })
  list(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: JobApplicationStatus,
    @Query('phone') phone?: string,
  ) {
    return this.applications.list({
      take: clamp(intOrDefault(take, 50), 1, 200),
      skip: Math.max(intOrDefault(skip, 0), 0),
      status,
      phone,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update status or recruiter notes' })
  update(@Param('id') id: string, @Body() body: UpdateApplicationDto) {
    return this.applications.update(id, body);
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
