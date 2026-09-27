import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  createSession(@Param('projectId') projectId: string, @Request() req: any) {
    return this.chatService.getOrCreateSession(projectId, req.user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List chat sessions for a project' })
  listSessions(@Param('projectId') projectId: string, @Request() req: any) {
    return this.chatService.listSessions(projectId, req.user.id);
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Send a message in a chat session' })
  sendMessage(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(projectId, req.user.id, sessionId, dto);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get all messages in a chat session' })
  getMessages(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    return this.chatService.getMessages(sessionId, projectId, req.user.id);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Delete a chat session' })
  deleteSession(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    return this.chatService.deleteSession(sessionId, projectId, req.user.id);
  }
}
