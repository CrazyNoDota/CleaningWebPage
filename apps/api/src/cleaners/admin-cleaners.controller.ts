import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { CleanersService } from './cleaners.service';
import { CreateCleanerDto } from './dto/create-cleaner.dto';
import { UpdateCleanerDto } from './dto/update-cleaner.dto';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';

@ApiTags('admin-cleaners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin')
@Controller('admin/cleaners')
export class AdminCleanersController {
  constructor(private readonly cleaners: CleanersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboard a new cleaner (creates User if needed)' })
  create(@Body() body: CreateCleanerDto) {
    return this.cleaners.adminCreate(body);
  }

  @Get()
  @ApiOperation({ summary: 'List cleaners with optional filters' })
  list(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('isActive') isActive?: string,
    @Query('verificationStatus') verificationStatus?: VerificationStatus,
  ) {
    return this.cleaners.adminList({
      take: clamp(intOrDefault(take, 50), 1, 200),
      skip: Math.max(intOrDefault(skip, 0), 0),
      isActive:
        isActive === undefined ? undefined : isActive === 'true' || isActive === '1',
      verificationStatus,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single cleaner (admin view, includes contact PII)' })
  getOne(@Param('id') id: string) {
    return this.cleaners.adminGet(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update profile fields, verification status, or active flag',
  })
  update(@Param('id') id: string, @Body() body: UpdateCleanerDto) {
    return this.cleaners.adminUpdate(id, body);
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
