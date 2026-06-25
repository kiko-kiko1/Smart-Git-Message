import { ChatMessage } from '../client';

// 生成 commit message 的 prompt 选项
export interface CommitPromptOptions {
  diff: string;
  language: string;
  useSemantic: boolean;
  commitHistory?: string;
  styleInfo?: string;
}

// 构建系统提示词
function buildSystemPrompt(language: string, useSemantic: boolean, styleInfo?: string): string {
  let prompt = `你是一个专业的 Git Commit Message 生成助手。你的任务是根据代码变更生成高质量的 commit message。

要求：
- 输出语言：${language === 'zh_CN' ? '简体中文' : language === 'zh_TW' ? '繁體中文' : language === 'ja_JP' ? '日本語' : 'English'}
- commit message 应该简洁明了，准确描述变更内容
- 标题不超过 72 个字符
- 使用祈使句语气
- 只输出 commit message，不要任何解释或额外内容`;

  if (useSemantic) {
    prompt += `

请遵循 Conventional Commits 规范，格式如下：
<type>(<scope>): <subject>

<body>

type 可选值：feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 代码格式（不影响功能）
- refactor: 重构（既不新增功能也不修复bug）
- perf: 性能优化
- test: 增加或修改测试
- chore: 构建过程或辅助工具的变动
- ci: CI 配置变更
- build: 构建系统或依赖变更
- revert: 回滚提交

scope 是可选的，表示影响的范围（模块名、组件名等）。
body 是可选的，用于详细描述变更内容和原因。`;
  }

  if (styleInfo) {
    prompt += `

请参考以下项目历史 commit 的风格特点：
${styleInfo}`;
  }

  return prompt;
}

// 构建用户提示词
function buildUserPrompt(diff: string, commitHistory?: string): string {
  let prompt = `以下是代码变更的 diff：

\`\`\`diff
${diff}
\`\`\``;

  if (commitHistory && commitHistory.trim().length > 0) {
    prompt += `

以下是项目的一些历史 commit message，供你参考风格：

\`\`\`
${commitHistory}
\`\`\``;
  }

  prompt += `

请生成合适的 commit message。`;

  return prompt;
}

// 生成 commit message 的完整消息列表
export function buildCommitMessages(options: CommitPromptOptions): ChatMessage[] {
  const { diff, language, useSemantic, commitHistory, styleInfo } = options;

  return [
    {
      role: 'system',
      content: buildSystemPrompt(language, useSemantic, styleInfo),
    },
    {
      role: 'user',
      content: buildUserPrompt(diff, commitHistory),
    },
  ];
}

// 解析 LLM 返回的 commit message
export function parseCommitMessage(rawContent: string): {
  subject: string;
  body: string;
  type?: string;
  scope?: string;
} {
  const lines = rawContent.trim().split('\n');

  let subject = lines[0]?.trim() || '';
  let body = '';
  let type: string | undefined;
  let scope: string | undefined;

  // 尝试解析 Conventional Commits 格式
  const conventionalMatch = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (conventionalMatch) {
    type = conventionalMatch[1].toLowerCase();
    scope = conventionalMatch[2] || undefined;
    subject = conventionalMatch[3].trim();
  }

  // 提取 body（第一行之后的内容）
  if (lines.length > 1) {
    // 跳过第一行和可能的空行
    const bodyLines: string[] = [];
    let started = false;
    for (let i = 1; i < lines.length; i++) {
      if (!started && lines[i].trim() === '') {
        started = true;
        continue;
      }
      if (started) {
        bodyLines.push(lines[i]);
      }
    }
    body = bodyLines.join('\n').trim();
  }

  return { subject, body, type, scope };
}
