import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SubmitApplicationDto {
  @ApiProperty({ example: 'Aigerim K' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '+77011234567' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'phone must be E.164 (e.g. +77011234567)' })
  phone!: string;

  @ApiProperty({ required: false, description: 'Slug of a known city (e.g. astana)' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Free-text city if not in our list' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cityFreeText?: string;

  @ApiProperty({ required: false, minimum: 16, maximum: 80 })
  @IsOptional()
  @IsInt()
  @Min(16)
  @Max(80)
  age?: number;

  @ApiProperty({ required: false, example: '3 years at SuperClean Astana' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  experience?: string;

  @ApiProperty({ required: false, default: 'web' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;

  @ApiProperty({
    required: false,
    description: 'Public URL to the uploaded resume (issued by @vercel/blob)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  resumeUrl?: string;
}
