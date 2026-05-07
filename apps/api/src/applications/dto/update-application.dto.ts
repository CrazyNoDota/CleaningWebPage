import { ApiProperty } from '@nestjs/swagger';
import { JobApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationDto {
  @ApiProperty({ enum: JobApplicationStatus, required: false })
  @IsOptional()
  @IsEnum(JobApplicationStatus)
  status?: JobApplicationStatus;

  @ApiProperty({ required: false, description: 'Internal recruiter notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
