import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { HOME_PLANS_MAX_PER_GROUP } from '../home-plans';

export class HomePlanDto {
  @ApiProperty({ example: '1k', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  key?: string;

  @ApiProperty({ example: 'Однушка' })
  @IsString()
  @MaxLength(48)
  title!: string;

  @ApiProperty({ example: '1 комната' })
  @IsString()
  @MaxLength(48)
  rooms!: string;

  @ApiProperty({ example: '1 санузел' })
  @IsString()
  @MaxLength(48)
  bath!: string;

  @ApiProperty({ example: 'от 15 000 ₸' })
  @IsString()
  @MaxLength(48)
  price!: string;

  @ApiProperty({ example: 'TOP', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  badge?: string;
}

export class UpdateHomePlansDto {
  @ApiProperty({ type: [HomePlanDto], maxItems: HOME_PLANS_MAX_PER_GROUP })
  @IsArray()
  @ArrayMaxSize(HOME_PLANS_MAX_PER_GROUP)
  @ValidateNested({ each: true })
  @Type(() => HomePlanDto)
  apartment!: HomePlanDto[];

  @ApiProperty({ type: [HomePlanDto], maxItems: HOME_PLANS_MAX_PER_GROUP })
  @IsArray()
  @ArrayMaxSize(HOME_PLANS_MAX_PER_GROUP)
  @ValidateNested({ each: true })
  @Type(() => HomePlanDto)
  house!: HomePlanDto[];
}
