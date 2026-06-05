import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateToken(token: string) {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      return user;
    } catch {
      return null;
    }
  }

  async saveMessage(userId: number, roomId: number, body: string) {
    const message = await this.prisma.message.create({
      data: {
        body,
        senderId: userId,
        roomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const cacheKey = `messages:room:${roomId}`;
    await this.redis.del(cacheKey);

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    const otherMembers = room!.users.filter(
      (member) => member.userId !== userId,
    );

    for (const member of otherMembers) {
      await this.mailService.sendMessageNotification(
        member.user.email,
        member.user.name,
        message.sender.name,
        room!.name,
        body,
      );
    }

    return message;
  }
}