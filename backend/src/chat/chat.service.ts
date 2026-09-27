import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAdapterService } from '../ai-providers/ai-adapter.service';
import { ProjectsService } from '../projects/projects.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiAdapter: AiAdapterService,
    private projectsService: ProjectsService,
  ) {}

  async getOrCreateSession(projectId: string, userId: string, sessionId?: string) {
    await this.projectsService.findOne(projectId, userId);

    if (sessionId) {
      const session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, projectId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!session) throw new NotFoundException('Chat session not found');
      return session;
    }

    return this.prisma.chatSession.create({
      data: { projectId, userId, title: 'New Chat' },
      include: { messages: true },
    });
  }

  async listSessions(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    return this.prisma.chatSession.findMany({
      where: { projectId, userId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async sendMessage(
    projectId: string,
    userId: string,
    sessionId: string,
    dto: SendMessageDto,
  ) {
    const session = await this.getOrCreateSession(projectId, userId, sessionId);

    // Get relevant project files for context (simple keyword matching)
    const allFiles = await this.prisma.file.findMany({
      where: { projectId },
      select: { name: true, path: true, content: true },
    });

    const relevantFiles = this.findRelevantFiles(dto.message, allFiles);

    // Build messages history
    const history = session.messages.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));

    // Build system prompt with code context
    const codeContext =
      relevantFiles.length > 0
        ? `\n\nRelevant project files for context:\n${relevantFiles
            .map((f) => `=== ${f.path} ===\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``)
            .join('\n\n')}`
        : '';

    const systemPrompt = `You are an expert code assistant helping developers understand and improve their code.
Answer questions based on the uploaded project code.
Be precise, technical, and cite specific files and line numbers when possible.${codeContext}`;

    // Save user message
    await this.prisma.message.create({
      data: { sessionId, role: 'USER', content: dto.message },
    });

    // Get AI response
    const aiResponse = await this.aiAdapter.complete({
      userId,
      providerId: dto.providerId,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: dto.message },
      ],
      maxTokens: 2048,
      temperature: 0.5,
    });

    // Save assistant message
    const assistantMessage = await this.prisma.message.create({
      data: { sessionId, role: 'ASSISTANT', content: aiResponse },
    });

    // Update session title from first user message
    if (session.messages.length === 0) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          title: dto.message.slice(0, 60),
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    return assistantMessage;
  }

  async getMessages(sessionId: string, projectId: string, userId: string) {
    await this.getOrCreateSession(projectId, userId, sessionId);
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteSession(sessionId: string, projectId: string, userId: string) {
    await this.getOrCreateSession(projectId, userId, sessionId);
    return this.prisma.chatSession.delete({ where: { id: sessionId } });
  }

  /**
   * Simple keyword-based retrieval — finds files whose path or content
   * contains words from the user message. Good enough for a code assistant
   * without needing embeddings.
   */
  private findRelevantFiles(
    query: string,
    files: { name: string; path: string; content: string }[],
  ) {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const scored = files.map((file) => {
      const haystack = `${file.path} ${file.content}`.toLowerCase();
      const score = keywords.filter((kw) => haystack.includes(kw)).length;
      return { ...file, score };
    });

    return scored
      .filter((f) => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 most relevant files
  }
}
