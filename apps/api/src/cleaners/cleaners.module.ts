import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CleanersController } from './cleaners.controller';
import { CleanersService } from './cleaners.service';

@Module({
  imports: [AuthModule],
  controllers: [CleanersController],
  providers: [CleanersService],
  exports: [CleanersService],
})
export class CleanersModule {}
