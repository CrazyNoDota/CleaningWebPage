import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderOptionDto {
  @ApiProperty({ example: 'windows' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  qty?: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'apartment-standard' })
  @IsString()
  serviceSlug!: string;

  @ApiProperty({ example: '2026-05-12T10:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ example: 'addr-uuid' })
  @IsString()
  addressId!: string;

  @ApiProperty({ example: { area_m2: 60, rooms: 2 } })
  @IsObject()
  inputs!: Record<string, number>;

  @ApiProperty({ type: [CreateOrderOptionDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderOptionDto)
  options?: CreateOrderOptionDto[];

  @ApiProperty({ required: false, example: 'Domofon code 4321' })
  @IsOptional()
  @IsString()
  notes?: string;
}
