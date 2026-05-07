import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionStatusDto {
  @ApiProperty({ enum: OrderStatus, example: 'en_route' })
  @IsEnum(OrderStatus)
  to!: OrderStatus;

  @ApiProperty({ required: false, example: 'arrived 5 min early' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
