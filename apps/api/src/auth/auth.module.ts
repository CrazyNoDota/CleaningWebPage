import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SmsModule } from '../notifications/sms/sms.module';

@Module({
  imports: [
    SmsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TTL') ?? '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService, GoogleAuthService, JwtAuthGuard],
  exports: [AuthService, TokenService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
