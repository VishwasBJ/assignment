import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiProviderDto } from './dto/create-ai-provider.dto';
import { UpdateAiProviderDto } from './dto/update-ai-provider.dto';

@Injectable()
export class AiProvidersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAiProviderDto) {
    if (dto.isDefault) {
      // Unset other defaults for this user
      await this.prisma.aIProvider.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.aIProvider.create({ data: { ...dto, userId } });
  }

  async findAll(userId: string) {
    return this.prisma.aIProvider.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const provider = await this.prisma.aIProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('AI Provider not found');
    if (provider.userId !== userId) throw new ForbiddenException();
    return provider;
  }

  async findDefault(userId: string) {
    return this.prisma.aIProvider.findFirst({
      where: { userId, isDefault: true },
    });
  }

  async update(id: string, userId: string, dto: UpdateAiProviderDto) {
    await this.findOne(id, userId);
    if (dto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.aIProvider.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.aIProvider.delete({ where: { id } });
  }
}
