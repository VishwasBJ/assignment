import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewEngineService } from './review-engine.service';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { ProjectsModule } from '../projects/projects.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [AiProvidersModule, ProjectsModule, FilesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewEngineService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
