import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { AdminApplicationsController } from './admin-applications.controller';
import { ResumeUploadController } from './resume-upload.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ApplicationsController, AdminApplicationsController, ResumeUploadController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
