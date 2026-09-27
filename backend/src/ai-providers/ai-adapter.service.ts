import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { AiProvidersService } from './ai-providers.service';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  providerId?: string;
  userId: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * Strategy pattern: all AI providers expose the same OpenAI-compatible chat
 * completions API. We just swap the baseUrl / apiKey / modelName.
 * This means OpenAI, LM Studio, Ollama (/v1 endpoint), and OpenRouter all
 * work without changing business logic.
 */
@Injectable()
export class AiAdapterService {
  constructor(private aiProvidersService: AiProvidersService) {}

  async complete(opts: AiCompletionOptions): Promise<string> {
    // Resolve which provider to use
    let provider: any;
    if (opts.providerId) {
      provider = await this.aiProvidersService.findOne(opts.providerId, opts.userId);
    } else {
      provider = await this.aiProvidersService.findDefault(opts.userId);
    }

    if (!provider) {
      throw new BadRequestException(
        'No AI provider configured. Please add a provider in Settings.',
      );
    }

    const url = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    // OpenRouter requires a specific header
    if (provider.providerType === 'OPENROUTER') {
      headers['HTTP-Referer'] = 'https://ai-code-review-assistant.local';
      headers['X-Title'] = 'AI Code Review Assistant';
    }

    try {
      const response = await axios.post(
        url,
        {
          model: provider.modelName,
          messages: opts.messages,
          max_tokens: opts.maxTokens ?? 4096,
          temperature: opts.temperature ?? 0.3,
        },
        { headers, timeout: 120_000 },
      );

      return response.data.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      const detail = err.response?.data?.error?.message || err.message;
      throw new BadRequestException(`AI provider error: ${detail}`);
    }
  }
}
