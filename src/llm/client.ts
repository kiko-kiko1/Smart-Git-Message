import { AppConfig } from '../config';
import { errors } from '../utils/errors';

// Chat Completion 请求消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Chat Completion 请求参数
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Chat Completion 响应
export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// LLM 客户端选项
export interface LLMClientOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout?: number;
}

// LLM 客户端类
export class LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private timeout: number;

  constructor(options: LLMClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeout = options.timeout || 60000; // 默认 60 秒超时
  }

  // 从配置创建客户端
  static fromConfig(config: AppConfig): LLMClient {
    return new LLMClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.modelName,
    });
  }

  // 发送 chat completion 请求
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

    const body: ChatCompletionRequest = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = (await response.json()) as { error?: { message?: string } };
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // 忽略解析错误
        }
        throw errors.llmApiError(errorMessage);
      }

      const data = (await response.json()) as ChatCompletionResponse;

      if (!data.choices || data.choices.length === 0) {
        throw errors.llmInvalidResponse();
      }

      const content = data.choices[0].message.content;

      if (!content || content.trim() === '') {
        throw errors.llmInvalidResponse();
      }

      return content.trim();
    } catch (e) {
      clearTimeout(timeoutId);

      if (e instanceof Error && e.name === 'AbortError') {
        throw errors.llmTimeout();
      }

      if (e instanceof Error && e.name === 'AppError') {
        throw e;
      }

      throw errors.llmApiError(e instanceof Error ? e.message : String(e));
    }
  }
}
