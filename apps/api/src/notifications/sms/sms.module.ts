import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { StubSmsProvider } from './providers/stub.provider';
import { MobizonSmsProvider } from './providers/mobizon.provider';
import { SMS_PROVIDER } from './sms.tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    StubSmsProvider,
    MobizonSmsProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, StubSmsProvider, MobizonSmsProvider],
      useFactory: (config: ConfigService, stub: StubSmsProvider, mobizon: MobizonSmsProvider) => {
        const provider = config.get<string>('SMS_PROVIDER') ?? 'stub';
        return provider === 'mobizon' ? mobizon : stub;
      },
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
