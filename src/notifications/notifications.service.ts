import { Injectable } from '@nestjs/common';
import { ResendService } from './resend.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly resendService: ResendService) {}

  async sendEmail(to: string, subject: string, text: string) {
    await this.resendService.sendEmail(to, subject, text);
  }
}
