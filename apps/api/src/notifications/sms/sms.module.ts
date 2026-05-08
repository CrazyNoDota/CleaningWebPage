import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { StubSmsProvider } from './providers/stub.provider';
import { MobizonSmsProvider } from './providers/mobizon.provider';
import { TwilioSmsProvider } from './providers/twilio.provider';
import { SMS_PROVIDER } from './sms.tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    StubSmsProvider,
    MobizonSmsProvider,
    TwilioSmsProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, StubSmsProvider, MobizonSmsProvider, TwilioSmsProvider],
      useFactory: (
        config: ConfigService,
        stub: StubSmsProvider,
        mobizon: MobizonSmsProvider,
        twilio: TwilioSmsProvider,
      ) => {
        const provider = config.get<string>('SMS_PROVIDER') ?? 'stub';
        if (provider === 'mobizon') return mobizon;
        if (provider === 'twilio') return twilio;
        return stub;
      },
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
