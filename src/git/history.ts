import { ensureGitRepo, runGitCommand } from './staging';

// 单条 commit 记录
export interface CommitRecord {
  hash: string;
  subject: string;
  body: string;
  author: string;
  date: string;
}

// commit 历史集合
export interface CommitHistory {
  commits: CommitRecord[];
  totalCount: number;
}

// 获取历史 commit 记录
// count: 获取的 commit 数量，默认 50 条
export function getCommitHistory(count: number = 50, cwd?: string): CommitHistory {
  ensureGitRepo(cwd);

  // 使用 git log 获取格式化输出
  // 格式：hash | subject | body | author | date
  // 用特殊分隔符分隔每条 commit
  const separator = '---COMMIT_SEPARATOR---';
  const fieldSeparator = '---FIELD_SEPARATOR---';

  const format =
    [
      '%h', // 短 hash
      '%s', // subject
      '%b', // body
      '%an', // author name
      '%aI', // ISO 日期
    ].join(fieldSeparator) + separator;

  try {
    const output = runGitCommand(['log', `-${count}`, `--pretty=format:${format}`], cwd);

    const commits: CommitRecord[] = [];

    if (!output) {
      return { commits, totalCount: 0 };
    }

    const commitBlocks = output.split(separator).filter((b) => b.trim() !== '');

    for (const block of commitBlocks) {
      const fields = block.split(fieldSeparator);
      if (fields.length < 5) continue;

      const [hash, subject, body, author, date] = fields.map((f) => f.trim());

      commits.push({
        hash,
        subject,
        body,
        author,
        date,
      });
    }

    return {
      commits,
      totalCount: commits.length,
    };
  } catch {
    // 如果获取失败（比如没有任何 commit），返回空列表
    return { commits: [], totalCount: 0 };
  }
}
