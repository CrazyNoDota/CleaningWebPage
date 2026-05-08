import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminMetricsController } from './admin-metrics.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminMetricsController],
})
export class AdminMetricsModule {}
