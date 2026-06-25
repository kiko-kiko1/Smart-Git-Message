import { ensureGitRepo, runGitCommand } from './staging';

// 变更文件状态
export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

// 单个暂存文件信息
export interface StagedFile {
  filename: string;
  status: FileStatus;
  additions: number;
  deletions: number;
}

// 暂存区变更集合
export interface StagedChanges {
  files: StagedFile[];
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  rawDiff: string;
}

// 获取暂存区的完整 diff
export function getStagedDiff(cwd?: string): string {
  ensureGitRepo(cwd);
  return runGitCommand(['diff', '--cached', '--no-color', '--unified=3'], cwd);
}

// 获取暂存区文件列表和统计
export function getStagedFiles(cwd?: string): StagedFile[] {
  ensureGitRepo(cwd);

  // 获取文件状态列表（--numstat 显示新增/删除行数）
  const numstatOutput = runGitCommand(['diff', '--cached', '--numstat', '--diff-filter=AMDR'], cwd);

  const files: StagedFile[] = [];

  if (!numstatOutput) {
    return files;
  }

  const lines = numstatOutput.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const [additionsStr, deletionsStr, ...nameParts] = parts;
    const filename = nameParts.join('\t');

    const additions = parseInt(additionsStr, 10) || 0;
    const deletions = parseInt(deletionsStr, 10) || 0;

    const status: FileStatus = 'modified';
    if (additions > 0 && deletions === 0 && additionsStr !== '-') {
      // 需要进一步判断是新增还是修改
      // 先用 --name-status 确认
    }

    files.push({
      filename,
      status,
      additions,
      deletions,
    });
  }

  // 使用 --name-status 获取准确的状态
  const nameStatusOutput = runGitCommand(
    ['diff', '--cached', '--name-status', '--diff-filter=AMDR'],
    cwd,
  );

  if (nameStatusOutput) {
    const statusMap = new Map<string, FileStatus>();
    for (const line of nameStatusOutput.split('\n')) {
      if (!line.trim()) continue;
      const [statusChar, ...nameParts] = line.split('\t');
      const name = nameParts.join('\t');
      let status: FileStatus = 'modified';
      switch (statusChar.charAt(0)) {
        case 'A':
          status = 'added';
          break;
        case 'M':
          status = 'modified';
          break;
        case 'D':
          status = 'deleted';
          break;
        case 'R':
          status = 'renamed';
          break;
      }
      statusMap.set(name, status);
    }

    for (const file of files) {
      const s = statusMap.get(file.filename);
      if (s) {
        file.status = s;
      }
    }
  }

  return files;
}

// 获取完整的暂存区变更信息
export function getStagedChanges(cwd?: string): StagedChanges {
  const files = getStagedFiles(cwd);
  const rawDiff = getStagedDiff(cwd);

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return {
    files,
    totalFiles: files.length,
    totalAdditions,
    totalDeletions,
    rawDiff,
  };
}
