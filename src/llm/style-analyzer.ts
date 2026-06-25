import { CommitHistory, CommitRecord } from '../git/history';

// commit 风格分析结果
export interface CommitStyle {
  usesConventionalCommits: boolean;
  commonTypes: string[];
  language: string;
  hasScope: boolean;
  hasBody: boolean;
  subjectLength: {
    avg: number;
    max: number;
  };
}

// Conventional Commits type 列表
const CONVENTIONAL_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'chore',
  'ci',
  'build',
  'revert',
];

// 检测语言（基于 subject 中的字符）
function detectLanguage(commits: CommitRecord[]): string {
  if (commits.length === 0) {
    return 'en_US';
  }

  let chineseCount = 0;
  let japaneseCount = 0;

  for (const commit of commits) {
    const subject = commit.subject;
    // 检测中文字符
    if (/[\u4e00-\u9fa5]/.test(subject)) {
      chineseCount++;
    }
    // 检测日文字符（假名）
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(subject)) {
      japaneseCount++;
    }
  }

  const total = commits.length;
  const chineseRatio = chineseCount / total;
  const japaneseRatio = japaneseCount / total;

  if (chineseRatio > 0.5) {
    return 'zh_CN';
  }
  if (japaneseRatio > 0.5) {
    return 'ja_JP';
  }
  return 'en_US';
}

// 分析 commit 风格
export function analyzeCommitStyle(history: CommitHistory): CommitStyle {
  const { commits } = history;

  // 默认风格
  const defaultStyle: CommitStyle = {
    usesConventionalCommits: false,
    commonTypes: [],
    language: 'en_US',
    hasScope: false,
    hasBody: false,
    subjectLength: { avg: 0, max: 0 },
  };

  if (commits.length === 0) {
    return defaultStyle;
  }

  // 统计 type 使用次数
  const typeCount = new Map<string, number>();
  let conventionalCount = 0;
  let scopeCount = 0;
  let bodyCount = 0;
  let totalSubjectLength = 0;
  let maxSubjectLength = 0;

  for (const commit of commits) {
    const subject = commit.subject.trim();

    // 统计 subject 长度
    totalSubjectLength += subject.length;
    if (subject.length > maxSubjectLength) {
      maxSubjectLength = subject.length;
    }

    // 检测 Conventional Commits 格式
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
      const type = match[1].toLowerCase();
      if (CONVENTIONAL_TYPES.includes(type)) {
        conventionalCount++;
        typeCount.set(type, (typeCount.get(type) || 0) + 1);

        if (match[2]) {
          scopeCount++;
        }
      }
    }

    // 检测是否有 body
    if (commit.body && commit.body.trim().length > 0) {
      bodyCount++;
    }
  }

  const total = commits.length;
  const conventionalRatio = conventionalCount / total;

  // 按使用次数排序的 type 列表
  const commonTypes = Array.from(typeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type)
    .slice(0, 5); // 取前 5 个最常用的

  return {
    usesConventionalCommits: conventionalRatio > 0.5, // 超过 50% 使用就认为项目采用该规范
    commonTypes,
    language: detectLanguage(commits),
    hasScope: scopeCount / Math.max(conventionalCount, 1) > 0.3, // 30% 以上有 scope
    hasBody: bodyCount / total > 0.3, // 30% 以上有 body
    subjectLength: {
      avg: Math.round(totalSubjectLength / total),
      max: maxSubjectLength,
    },
  };
}

// 生成风格描述文本，用于 prompt
export function formatStyleInfo(style: CommitStyle): string {
  const lines: string[] = [];

  if (style.usesConventionalCommits) {
    lines.push(`- 使用 Conventional Commits 格式`);
    if (style.commonTypes.length > 0) {
      lines.push(`- 常用 type: ${style.commonTypes.join(', ')}`);
    }
    if (style.hasScope) {
      lines.push(`- 经常使用 scope`);
    }
  }

  lines.push(`- 主要语言: ${style.language}`);
  lines.push(`- 标题平均长度: ${style.subjectLength.avg} 字符`);

  if (style.hasBody) {
    lines.push(`- 经常包含正文描述`);
  }

  return lines.join('\n');
}
