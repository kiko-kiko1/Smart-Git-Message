import { LLMClient } from './client';
import { buildCommitMessages, parseCommitMessage } from './prompts/commit';
import { AppConfig } from '../config';
import { errors } from '../utils/errors';
import { estimateTokens, truncateDiff } from '../utils/token-counter';

// 生成的 commit message 结果
export interface GeneratedCommitMessage {
  subject: string;
  body: string;
  type?: string;
  scope?: string;
}

// 生成选项
export interface GenerateOptions {
  diff: string;
  config: AppConfig;
  commitHistory?: string;
  styleInfo?: string;
  maxTokens?: number;
}

// LLM 服务类
export class LLMService {
  private client: LLMClient;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.client = LLMClient.fromConfig(config);
    this.config = config;
  }

  // 生成 commit message
  async generateCommitMessage(options: GenerateOptions): Promise<GeneratedCommitMessage> {
    const { diff, commitHistory, styleInfo, maxTokens = 3000 } = options;

    // 检查 diff token 数量，如果太大则截断
    let processedDiff = diff;
    const diffTokens = estimateTokens(diff);

    if (diffTokens > maxTokens) {
      processedDiff = truncateDiff(diff, {
        maxTokens,
        maxFiles: 15,
        maxLinesPerFile: 30,
      });
    }

    // 构建消息
    const messages = buildCommitMessages({
      diff: processedDiff,
      language: this.config.defaultLanguage,
      useSemantic: this.config.useSemanticCommit,
      commitHistory,
      styleInfo,
    });

    // 调用 LLM
    const rawResponse = await this.client.chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 500,
    });

    // 解析结果
    const parsed = parseCommitMessage(rawResponse);

    if (!parsed.subject) {
      throw errors.llmInvalidResponse();
    }

    return parsed;
  }
}

export { LLMClient } from './client';
export { buildCommitMessages, parseCommitMessage } from './prompts/commit';
export { analyzeCommitStyle, formatStyleInfo, CommitStyle } from './style-analyzer';
