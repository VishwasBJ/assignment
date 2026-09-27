import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'What does the AuthService do?' })
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  providerId?: string;
}
