import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Slug of a city this address is in (e.g. "astana")',
    example: 'astana',
  })
  @IsString()
  @MinLength(2)
  city!: string;

  @ApiProperty({ required: false, example: 'Дом' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiProperty({ example: 'ул. Республики' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  street!: string;

  @ApiProperty({ example: '24' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  building!: string;

  @ApiProperty({ required: false, example: '12' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment?: string;

  @ApiProperty({ required: false, example: 'Подъезд 2, домофон 4321' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @ApiProperty({ required: false, example: 51.1605 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiProperty({ required: false, example: 71.4704 })
  @IsOptional()
  @IsLongitude()
  lng?: number;
}
