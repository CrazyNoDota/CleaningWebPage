import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({
    required: false,
    description: 'Client-generated idempotency key for retry-safe payment creation.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}
