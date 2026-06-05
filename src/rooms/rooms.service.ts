import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateRoomDto) {
    const existingRoom = await this.prisma.room.findUnique({
      where: { name: dto.name },
    });

    if (existingRoom) {
      throw new ConflictException('Room with this name already exists');
    }

    const room = await this.prisma.room.create({
      data: { name: dto.name },
    });

    return {
      message: 'Room created successfully',
      data: room,
    };
  }

  async findAll() {
    const cacheKey = 'rooms:all';

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return {
        message: 'Rooms retrieved successfully (cached)',
        data: JSON.parse(cached),
      };
    }

    const rooms = await this.prisma.room.findMany({
      include: {
        _count: {
          select: {
            users: true,
            messages: true,
          },
        },
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(rooms), 60);

    return {
      message: 'Rooms retrieved successfully',
      data: rooms,
    };
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            messages: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return {
      message: 'Room retrieved successfully',
      data: room,
    };
  }

  async join(userId: number, roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }

    const existingMember = await this.prisma.roomUser.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this room');
    }

    await this.prisma.roomUser.create({
      data: {
        userId,
        roomId,
      },
    });

    await this.redis.del('rooms:all');

    return {
      message: 'Joined room successfully',
    };
  }

  async getMessages(roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }

    const cacheKey = `messages:room:${roomId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return {
        message: 'Messages retrieved successfully (cached)',
        data: JSON.parse(cached),
      };
    }

    const messages = await this.prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(messages), 30);

    return {
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }
}