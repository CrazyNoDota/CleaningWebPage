import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCleanerDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(2000)
  bioRu?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(2000)
  bioKk?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(2000)
  bioEn?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) @Max(60)
  yearsOfExperience?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  specialization?: string[];

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  photoUrl?: string;

  @ApiProperty({ required: false, enum: VerificationStatus })
  @IsOptional() @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiProperty({ required: false })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
