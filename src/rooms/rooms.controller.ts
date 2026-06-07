import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(JwtGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'Create a new room' })
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @ApiOperation({ summary: 'Get all rooms' })
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @ApiOperation({ summary: 'Get a single room' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @ApiOperation({ summary: 'Join a room' })
  @Post(':id/join')
  join(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) roomId: number,
  ) {
    return this.roomsService.join(userId, roomId);
  }

  @ApiOperation({ summary: 'Get room messages' })
  @Get(':id/messages')
  getMessages(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.getMessages(id);
  }
}