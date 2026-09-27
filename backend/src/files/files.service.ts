import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp',
  'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt',
  'json', 'yaml', 'yml', 'toml', 'xml', 'html',
  'css', 'scss', 'sass', 'less', 'md', 'txt',
  'sh', 'bash', 'zsh', 'fish', 'ps1',
  'sql', 'graphql', 'prisma', 'env',
  'dockerfile', 'makefile', 'gitignore',
]);

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
  ) {}

  private getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private isTextFile(filename: string): boolean {
    const ext = this.getExtension(filename);
    return TEXT_EXTENSIONS.has(ext);
  }

  async uploadFiles(
    projectId: string,
    userId: string,
    files: Express.Multer.File[],
    paths: string[],
  ) {
    // Verify project ownership
    await this.projectsService.findOne(projectId, userId);

    const created = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.originalname;

      if (!this.isTextFile(file.originalname)) {
        continue; // Skip binary files
      }

      const content = file.buffer.toString('utf-8');

      const existing = await this.prisma.file.findFirst({
        where: { projectId, path: relativePath },
      });

      if (existing) {
        const updated = await this.prisma.file.update({
          where: { id: existing.id },
          data: { content, size: file.size, mimeType: file.mimetype },
        });
        created.push(updated);
      } else {
        const newFile = await this.prisma.file.create({
          data: {
            name: file.originalname,
            path: relativePath,
            content,
            mimeType: file.mimetype,
            size: file.size,
            projectId,
          },
        });
        created.push(newFile);
      }
    }

    return created;
  }

  async getFileTree(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    const files = await this.prisma.file.findMany({
      where: { projectId },
      select: { id: true, name: true, path: true, size: true, mimeType: true, createdAt: true },
      orderBy: { path: 'asc' },
    });
    return this.buildTree(files);
  }

  private buildTree(files: { id: string; name: string; path: string; size: number; mimeType: string | null; createdAt: Date }[]) {
    const root: any = { type: 'directory', name: 'root', children: {} };

    for (const file of files) {
      const parts = file.path.split('/');
      let node = root;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!node.children[part]) {
          node.children[part] = { type: 'directory', name: part, children: {} };
        }
        node = node.children[part];
      }

      const filename = parts[parts.length - 1];
      node.children[filename] = {
        type: 'file',
        id: file.id,
        name: filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        createdAt: file.createdAt,
      };
    }

    return this.flattenTree(root);
  }

  private flattenTree(node: any): any {
    if (node.type === 'file') return node;
    return {
      type: 'directory',
      name: node.name,
      children: Object.values(node.children).map((child: any) =>
        this.flattenTree(child),
      ),
    };
  }

  async getFileContent(fileId: string, projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async deleteFile(fileId: string, projectId: string, userId: string) {
    await this.getFileContent(fileId, projectId, userId);
    return this.prisma.file.delete({ where: { id: fileId } });
  }

  async getFilesByProject(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    return this.prisma.file.findMany({
      where: { projectId },
      select: { id: true, name: true, path: true, size: true, createdAt: true },
    });
  }
}
