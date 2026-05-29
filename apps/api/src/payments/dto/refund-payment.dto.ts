import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ description: 'Refund amount in the smallest currency unit (e.g. KZT tenge).' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ required: false, description: 'Free-form reason recorded for audit.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
