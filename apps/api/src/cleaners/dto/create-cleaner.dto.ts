import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCleanerDto {
  @ApiProperty({ example: '+77011234567' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'phone must be E.164' })
  phone!: string;

  @ApiProperty({ example: 'Айгуль К' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  bioRu?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  bioKk?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(2000)
  bioEn?: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 60 })
  @IsOptional() @IsInt() @Min(0) @Max(60)
  yearsOfExperience?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  specialization?: string[];

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  photoUrl?: string;
}
