import { ApiProperty } from '@nestjs/swagger';
import { Locale, NotificationChannel } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: Locale, required: false })
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;

  @ApiProperty({ enum: NotificationChannel, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(NotificationChannel, { each: true })
  notificationChannels?: NotificationChannel[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  telegramChatId?: string;
}
