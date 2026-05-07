import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateReviewDto {
  @ApiProperty({ enum: [ReviewStatus.published, ReviewStatus.hidden, ReviewStatus.rejected] })
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
