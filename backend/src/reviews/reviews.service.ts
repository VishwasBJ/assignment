import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { FilesService } from '../files/files.service';
import { ReviewEngineService } from './review-engine.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewTemplate } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private filesService: FilesService,
    private reviewEngine: ReviewEngineService,
  ) {}

  async createReview(userId: string, projectId: string, dto: CreateReviewDto) {
    // Verify ownership
    await this.projectsService.findOne(projectId, userId);

    // Get files to review
    let files: any[];
    if (dto.fileIds && dto.fileIds.length > 0) {
      files = await this.prisma.file.findMany({
        where: { id: { in: dto.fileIds }, projectId },
      });
    } else {
      files = await this.prisma.file.findMany({ where: { projectId } });
    }

    if (files.length === 0) {
      throw new NotFoundException('No files found to review');
    }

    // Create review record as PENDING first
    const review = await this.prisma.review.create({
      data: {
        title: dto.title || `${dto.templateType} Review`,
        templateType: dto.templateType,
        status: 'IN_PROGRESS',
        projectId,
        fileIds: files.map((f) => f.id),
      },
    });

    // Run AI review asynchronously but we await it here (simple approach)
    try {
      const result = await this.reviewEngine.reviewFiles(
        files,
        dto.templateType as ReviewTemplate,
        userId,
        dto.providerId,
      );

      return this.prisma.review.update({
        where: { id: review.id },
        data: {
          status: 'COMPLETED',
          summary: result.summary,
          issues: result.issues as any,
          recommendations: result.recommendations as any,
          severity: result.severity as any,
          rawResponse: JSON.stringify(result),
        },
      });
    } catch (err: any) {
      await this.prisma.review.update({
        where: { id: review.id },
        data: { status: 'FAILED', summary: err.message },
      });
      throw err;
    }
  }

  async findAllByProject(projectId: string, userId: string, search?: string) {
    await this.projectsService.findOne(projectId, userId);
    return this.prisma.review.findMany({
      where: {
        projectId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    const review = await this.prisma.review.findFirst({
      where: { id, projectId },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async deleteReview(id: string, projectId: string, userId: string) {
    await this.findOne(id, projectId, userId);
    return this.prisma.review.delete({ where: { id } });
  }
}
