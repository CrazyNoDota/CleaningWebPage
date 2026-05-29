import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

// KZ phone format: +7 7XX XXX XXXX (12 digits including +)
const KZ_PHONE_REGEX = /^\+7\d{10}$/;

export class RequestOtpDto {
  @ApiProperty({ example: '+77001234567' })
  @IsString()
  @Matches(KZ_PHONE_REGEX, { message: 'phone must be in +7XXXXXXXXXX format' })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+77001234567' })
  @IsString()
  @Matches(KZ_PHONE_REGEX)
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code!: string;

  @ApiProperty({ required: false, example: 'Ansar' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token (JWT) obtained on the client via Sign in with Google' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AdminLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
