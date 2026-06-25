import { execSync } from 'child_process';
import { errors } from '../utils/errors';

// 执行 git 命令的工具函数
function runGitCommand(args: string[], cwd?: string): string {
  try {
    return execSync(`git ${args.join(' ')}`, {
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (e) {
    throw errors.gitCommandFailed(args.join(' '), e instanceof Error ? e.message : String(e));
  }
}

// 检查当前目录是否为 git 仓库
export function isGitRepo(cwd?: string): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: cwd || process.cwd(),
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

// 确保在 git 仓库中，否则抛出错误
export function ensureGitRepo(cwd?: string): void {
  if (!isGitRepo(cwd)) {
    throw errors.gitNotRepo();
  }
}

// 检查暂存区是否为空
export function isStagingEmpty(cwd?: string): boolean {
  ensureGitRepo(cwd);
  const output = runGitCommand(['diff', '--cached', '--name-only'], cwd);
  return output.length === 0;
}

// 确保暂存区不为空，否则抛出错误
export function ensureStagingNotEmpty(cwd?: string): void {
  if (isStagingEmpty(cwd)) {
    throw errors.gitStagingEmpty();
  }
}

// 检查是否存在未解决的合并冲突
export function hasMergeConflicts(cwd?: string): boolean {
  ensureGitRepo(cwd);
  try {
    const output = runGitCommand(['diff', '--name-only', '--diff-filter=U'], cwd);
    return output.length > 0;
  } catch {
    return false;
  }
}

export { runGitCommand };
