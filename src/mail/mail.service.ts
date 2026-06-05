import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

  async sendMessageNotification(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    roomName: string,
    messageBody: string,
  ) {
    await this.mailQueue.add('sendMessageNotification', {
      recipientEmail,
      recipientName,
      senderName,
      roomName,
      messageBody,
    });
  }
}