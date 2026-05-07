import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CleanersController } from './cleaners.controller';
import { AdminCleanersController } from './admin-cleaners.controller';
import { CleanersService } from './cleaners.service';

@Module({
  imports: [AuthModule],
  controllers: [CleanersController, AdminCleanersController],
  providers: [CleanersService],
  exports: [CleanersService],
})
export class CleanersModule {}
