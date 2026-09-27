import { Module } from '@nestjs/common';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersService } from './ai-providers.service';
import { AiAdapterService } from './ai-adapter.service';

@Module({
  controllers: [AiProvidersController],
  providers: [AiProvidersService, AiAdapterService],
  exports: [AiAdapterService, AiProvidersService],
})
export class AiProvidersModule {}
