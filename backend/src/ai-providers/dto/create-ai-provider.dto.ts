import { IsString, IsOptional, IsBoolean, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderType } from '@prisma/client';

export class CreateAiProviderDto {
  @ApiProperty({ example: 'My OpenAI' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ProviderType, example: 'OPENAI' })
  @IsEnum(ProviderType)
  providerType: ProviderType;

  @ApiProperty({ example: 'https://api.openai.com/v1' })
  @IsString()
  baseUrl: string;

  @ApiProperty({ example: 'sk-...', required: false })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiProperty({ example: 'gpt-4o-mini' })
  @IsString()
  modelName: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
