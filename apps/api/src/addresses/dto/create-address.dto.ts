import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const ADDRESS_TEXT_PATTERN = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s.'\\-/\\u2116]+$", 'u');
const HAS_LETTER_PATTERN = new RegExp('\\p{L}', 'u');
const HAS_DIGIT_PATTERN = new RegExp('\\d', 'u');
const HAS_LETTER_OR_DIGIT_PATTERN = new RegExp('[\\p{L}\\d]', 'u');

function normalizeAddressPart(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

function normalizeOptionalAddressPart(value: unknown): unknown {
  const normalized = normalizeAddressPart(value);
  return normalized === '' ? undefined : normalized;
}

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
  @Transform(({ value }) => normalizeAddressPart(value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Matches(HAS_LETTER_PATTERN, { message: 'street must contain a letter' })
  @Matches(ADDRESS_TEXT_PATTERN, { message: 'street contains unsupported characters' })
  street!: string;

  @ApiProperty({ example: '24' })
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeAddressPart(value)?.toString().toUpperCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(HAS_DIGIT_PATTERN, { message: 'building must contain a digit' })
  @Matches(ADDRESS_TEXT_PATTERN, { message: 'building contains unsupported characters' })
  building!: string;

  @ApiProperty({ required: false, example: '12' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? normalizeOptionalAddressPart(value)?.toString().toUpperCase()
      : value,
  )
  @IsString()
  @MaxLength(20)
  @Matches(HAS_LETTER_OR_DIGIT_PATTERN, {
    message: 'apartment must contain a letter or digit',
  })
  @Matches(ADDRESS_TEXT_PATTERN, { message: 'apartment contains unsupported characters' })
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
