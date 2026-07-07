import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ResendService } from './resend.service';

@Module({
  providers: [NotificationsService, ResendService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
