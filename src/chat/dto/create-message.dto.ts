import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsNumber()
  roomId!: number;
}