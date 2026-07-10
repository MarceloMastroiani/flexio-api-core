import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ResendService } from './resend.service';
import { NotificationsCron } from './notifications.cron';

@Module({
  providers: [NotificationsService, ResendService, NotificationsCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
