import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignCleanerDto {
  @ApiProperty({ example: 'cleaner-uuid' })
  @IsString()
  cleanerId!: string;
}
