import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewTemplate } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ example: 'Security check before deploy', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ReviewTemplate, example: 'SECURITY' })
  @IsEnum(ReviewTemplate)
  templateType: ReviewTemplate;

  @ApiProperty({
    description: 'File IDs to review. If empty, reviews all project files.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  fileIds?: string[];

  @ApiProperty({ description: 'AI provider ID to use. Falls back to default.', required: false })
  @IsOptional()
  @IsUUID()
  providerId?: string;
}
