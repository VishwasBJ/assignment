import {
  Controller, Get, Post, Delete,
  Param, UseGuards, Request, UseInterceptors,
  UploadedFiles, Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload files to a project' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('paths') paths: string | string[],
  ) {
    const pathArray = Array.isArray(paths) ? paths : paths ? [paths] : [];
    return this.filesService.uploadFiles(projectId, req.user.id, files, pathArray);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get file tree for a project' })
  getTree(@Param('projectId') projectId: string, @Request() req: any) {
    return this.filesService.getFileTree(projectId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all files in a project' })
  listFiles(@Param('projectId') projectId: string, @Request() req: any) {
    return this.filesService.getFilesByProject(projectId, req.user.id);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file content' })
  getFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Request() req: any,
  ) {
    return this.filesService.getFileContent(fileId, projectId, req.user.id);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file' })
  deleteFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Request() req: any,
  ) {
    return this.filesService.deleteFile(fileId, projectId, req.user.id);
  }
}
