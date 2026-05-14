import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDirectorSettingsDto {
  @ApiProperty({ enum: ['whatsapp', 'telegram'], required: false })
  @IsOptional()
  @IsIn(['whatsapp', 'telegram'])
  channel?: 'whatsapp' | 'telegram';

  @ApiProperty({ required: false, example: '77055975056' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappPhone?: string;

  @ApiProperty({ required: false, example: 'shinex_director' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramUsername?: string;
}
