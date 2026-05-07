import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ required: false, example: 'changed plans' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
