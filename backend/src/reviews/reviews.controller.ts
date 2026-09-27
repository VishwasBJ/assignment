import {
  Controller, Get, Post, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Run a new AI review on project files' })
  create(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(req.user.id, projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all reviews for a project' })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAllByProject(projectId, req.user.id, search);
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get a specific review' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('reviewId') reviewId: string,
    @Request() req: any,
  ) {
    return this.reviewsService.findOne(reviewId, projectId, req.user.id);
  }

  @Delete(':reviewId')
  @ApiOperation({ summary: 'Delete a review' })
  delete(
    @Param('projectId') projectId: string,
    @Param('reviewId') reviewId: string,
    @Request() req: any,
  ) {
    return this.reviewsService.deleteReview(reviewId, projectId, req.user.id);
  }
}
