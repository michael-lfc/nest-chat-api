// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { UseGuards } from '@nestjs/common';
// import { ChatService } from './chat.service';
// import { CreateMessageDto } from './dto/create-message.dto';
// import { WsJwtGuard } from './guards/ws-jwt.guard';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number; token: string },
  ) {
    const user = await this.chatService.validateToken(data.token);

    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const roomName = `room:${data.roomId}`;
    client.join(roomName);

    client.emit('joinedRoom', {
      message: `You joined room ${data.roomId}`,
      roomId: data.roomId,
    });

    console.log(`User ${user.name} joined room ${data.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { body: string; roomId: number; token: string },
  ) {
    const user = await this.chatService.validateToken(data.token);

    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const message = await this.chatService.saveMessage(
      user.id,
      data.roomId,
      data.body,
    );

    const roomName = `room:${data.roomId}`;

    this.server.to(roomName).emit('receiveMessage', {
      message: 'New message',
      data: message,
    });
  }
}