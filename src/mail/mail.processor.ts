import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('mail')
export class MailProcessor {
  constructor(private readonly mailer: MailerService) {}

  @Process('sendMessageNotification')
  async handleMessageNotification(job: Job) {
    const { recipientEmail, recipientName, senderName, roomName, messageBody } = job.data;

    await this.mailer.sendMail({
      to: recipientEmail,
      subject: `New message in ${roomName}`,
      html: `
        <h2>Hi ${recipientName},</h2>
        <p><strong>${senderName}</strong> sent a message in <strong>${roomName}</strong>:</p>
        <blockquote>${messageBody}</blockquote>
        <p>Login to reply.</p>
        <br/>
        <p>Chat API Team</p>
      `,
    });
  }
}