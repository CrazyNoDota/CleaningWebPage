import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteOptionDto {
  @ApiProperty({ example: 'windows' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  qty?: number;
}

export class QuoteDto {
  @ApiProperty({ example: 'apartment-standard' })
  @IsString()
  serviceSlug!: string;

  @ApiProperty({
    example: { area_m2: 60, rooms: 2 },
    description: 'User-supplied numeric inputs consumed by the pricing formula',
  })
  @IsObject()
  inputs!: Record<string, number>;

  @ApiProperty({ type: [QuoteOptionDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteOptionDto)
  options?: QuoteOptionDto[];
}
