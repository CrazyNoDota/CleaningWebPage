import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { CleanersController } from './cleaners.controller';
import { AdminCleanersController } from './admin-cleaners.controller';
import { CleanersService } from './cleaners.service';

@Module({
  imports: [AuthModule, TelegramModule],
  controllers: [CleanersController, AdminCleanersController],
  providers: [CleanersService],
  exports: [CleanersService],
})
export class CleanersModule {}
