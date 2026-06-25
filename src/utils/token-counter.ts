// 粗略估算 token 数量（基于字符数估算，约 4 个字符 = 1 个 token）
const CHARS_PER_TOKEN = 4;

// 估算文本的 token 数量
export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// 截断策略选项
export interface TruncateOptions {
  maxTokens: number;
  reserveTop?: number; // 顶部保留的行数
  reserveBottom?: number; // 底部保留的行数
}

// 截断大文本，确保不超过 token 限制
export function truncateText(text: string, options: TruncateOptions): string {
  const { maxTokens, reserveTop = 20, reserveBottom = 10 } = options;

  const currentTokens = estimateTokens(text);

  // 如果 token 数在限制内，直接返回
  if (currentTokens <= maxTokens) {
    return text;
  }

  const lines = text.split('\n');

  // 如果行数太少，直接按字符截断
  if (lines.length <= reserveTop + reserveBottom + 5) {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    return text.slice(0, maxChars) + '\n... [内容已截断]';
  }

  // 按行截断：保留顶部和底部，中间省略
  const topLines = lines.slice(0, reserveTop);
  const bottomLines = lines.slice(-reserveBottom);

  const truncated = [
    ...topLines,
    `... [省略 ${lines.length - reserveTop - reserveBottom} 行内容]`,
    ...bottomLines,
  ].join('\n');

  // 再次检查并递归调整
  if (estimateTokens(truncated) > maxTokens) {
    return truncateText(text, {
      maxTokens,
      reserveTop: Math.max(5, reserveTop - 5),
      reserveBottom: Math.max(3, reserveBottom - 3),
    });
  }

  return truncated;
}

// 对 diff 内容进行智能截断
// 策略：保留文件列表，每个文件只保留前 N 行变更
export interface DiffTruncateOptions {
  maxTokens: number;
  maxFiles?: number; // 最多保留的文件数
  maxLinesPerFile?: number; // 每个文件最多保留的行数
}

export function truncateDiff(diff: string, options: DiffTruncateOptions): string {
  const { maxTokens, maxFiles = 20, maxLinesPerFile = 50 } = options;

  const currentTokens = estimateTokens(diff);
  if (currentTokens <= maxTokens) {
    return diff;
  }

  // 按文件分割 diff（diff 中每个文件以 diff --git 开头）
  const fileDiffs = diff.split(/^diff --git /m).filter((d) => d.trim() !== '');

  if (fileDiffs.length === 0) {
    return truncateText(diff, { maxTokens });
  }

  // 限制文件数量
  const keptFiles = fileDiffs.slice(0, maxFiles);
  const omittedFiles = fileDiffs.length - maxFiles;

  // 对每个文件的 diff 进行行数限制
  const truncatedParts: string[] = [];

  for (const fileDiff of keptFiles) {
    const lines = fileDiff.split('\n');
    if (lines.length > maxLinesPerFile) {
      const headerEnd = lines.findIndex((line) => line.startsWith('+++') || line.startsWith('---'));
      const headerLines = lines.slice(0, Math.min(headerEnd + 2, maxLinesPerFile));
      const bodyLines = lines.slice(headerEnd + 2, maxLinesPerFile);
      truncatedParts.push(
        'diff --git ' + [...headerLines, ...bodyLines, `... [文件内容已截断]`].join('\n'),
      );
    } else {
      truncatedParts.push('diff --git ' + fileDiff);
    }
  }

  let result = truncatedParts.join('\n');

  if (omittedFiles > 0) {
    result += `\n\n... [省略 ${omittedFiles} 个文件的变更]`;
  }

  // 再次检查 token 数，如仍超限则进一步截断
  if (estimateTokens(result) > maxTokens) {
    return truncateText(result, { maxTokens, reserveTop: 50, reserveBottom: 10 });
  }

  return result;
}

// 从 diff 中提取变更文件列表
export function extractFileList(diff: string): string[] {
  const files: string[] = [];
  const regex = /^diff --git a\/(.+?) b\//gm;
  let match;

  while ((match = regex.exec(diff)) !== null) {
    files.push(match[1]);
  }

  return files;
}
