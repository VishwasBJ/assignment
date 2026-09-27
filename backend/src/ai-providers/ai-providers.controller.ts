import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiProvidersService } from './ai-providers.service';
import { CreateAiProviderDto } from './dto/create-ai-provider.dto';
import { UpdateAiProviderDto } from './dto/update-ai-provider.dto';

@ApiTags('ai-providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-providers')
export class AiProvidersController {
  constructor(private aiProvidersService: AiProvidersService) {}

  @Post()
  @ApiOperation({ summary: 'Add an AI provider' })
  create(@Request() req: any, @Body() dto: CreateAiProviderDto) {
    return this.aiProvidersService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List AI providers' })
  findAll(@Request() req: any) {
    return this.aiProvidersService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI provider details' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.aiProvidersService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update AI provider' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateAiProviderDto,
  ) {
    return this.aiProvidersService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete AI provider' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.aiProvidersService.remove(id, req.user.id);
  }
}
