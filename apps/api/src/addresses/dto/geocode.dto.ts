import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty({ example: 51.1605 })
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: 71.4704 })
  @IsLongitude()
  lng!: number;
}

export class ForwardGeocodeDto {
  @ApiProperty({ example: 'Республики 24' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  query!: string;

  @ApiProperty({ required: false, example: 'astana' })
  @IsOptional()
  @IsString()
  city?: string;
}
