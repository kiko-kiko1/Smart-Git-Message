import * as inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';

import {
  ensureGitRepo,
  ensureStagingNotEmpty,
  getStagedChanges,
  getCommitHistory,
  hasMergeConflicts,
} from '../../git';
import { loadConfig, AppConfig } from '../../config';
import { LLMService, GeneratedCommitMessage, analyzeCommitStyle, formatStyleInfo } from '../../llm';
import { createSpinner, success, displayError, separator } from '../ui/spinner';
import { AppError, ErrorCode, errors } from '../../utils/errors';

// commit 命令选项
export interface CommitCommandOptions {
  silence?: boolean;
}

// 执行 git commit
function executeGitCommit(message: string, cwd?: string): void {
  try {
    // 使用 -m 参数两次：第一次是 subject，第二次是 body
    const parts = message.split('\n\n');
    const args = ['commit'];

    if (parts.length === 1) {
      args.push('-m', `"${message.replace(/"/g, '\\"')}"`);
    } else {
      args.push('-m', `"${parts[0].replace(/"/g, '\\"')}"`);
      args.push('-m', `"${parts.slice(1).join('\n\n').replace(/"/g, '\\"')}"`);
    }

    execSync(`git ${args.join(' ')}`, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
    });
  } catch (e) {
    throw errors.commitFailed(e instanceof Error ? e.message : String(e));
  }
}

// 格式化显示 commit message
function formatCommitMessage(msg: GeneratedCommitMessage): string {
  let fullSubject = msg.subject;
  if (msg.type) {
    fullSubject = msg.scope
      ? `${msg.type}(${msg.scope}): ${msg.subject}`
      : `${msg.type}: ${msg.subject}`;
  }

  if (msg.body) {
    return `${fullSubject}\n\n${msg.body}`;
  }

  return fullSubject;
}

// 显示生成的 commit message 预览
function displayCommitPreview(msg: GeneratedCommitMessage): void {
  const fullMessage = formatCommitMessage(msg);

  console.log();
  console.log(chalk.bold.cyan('📝 生成的 commit message:'));
  console.log();
  console.log(separator());
  console.log(chalk.white(fullMessage));
  console.log(separator());
  console.log();
}

// 显示暂存区文件列表
function displayStagedFiles(changes: ReturnType<typeof getStagedChanges>): void {
  console.log();
  console.log(
    chalk.bold(
      `📋 检测到暂存区有 ${changes.totalFiles} 个文件变更 ` +
        chalk.green(`(+${changes.totalAdditions}`) +
        chalk.red(` -${changes.totalDeletions})`),
    ),
  );

  for (const file of changes.files.slice(0, 10)) {
    const statusColor =
      file.status === 'added'
        ? chalk.green
        : file.status === 'deleted'
          ? chalk.red
          : file.status === 'renamed'
            ? chalk.yellow
            : chalk.cyan;

    const statusLabel =
      file.status === 'added'
        ? '新增'
        : file.status === 'deleted'
          ? '删除'
          : file.status === 'renamed'
            ? '重命名'
            : '修改';

    console.log(
      `   ${statusColor(statusLabel.padEnd(4, ' '))} ${file.filename} ` +
        chalk.green(`+${file.additions}`) +
        chalk.red(` -${file.deletions}`),
    );
  }

  if (changes.files.length > 10) {
    console.log(chalk.gray(`   ... 还有 ${changes.files.length - 10} 个文件`));
  }
  console.log();
}

// 显示历史 commit 风格分析
function displayStyleAnalysis(
  history: ReturnType<typeof getCommitHistory>,
  style: ReturnType<typeof analyzeCommitStyle>,
): void {
  if (history.totalCount === 0) {
    console.log(chalk.gray('ℹ 项目暂无历史 commit，使用默认风格'));
    console.log();
    return;
  }

  console.log(chalk.cyan(`🤖 正在分析历史 commit 风格...`));

  if (style.usesConventionalCommits) {
    console.log(chalk.green(`✓ 检测到项目使用 Conventional Commits 风格`));
    if (style.commonTypes.length > 0) {
      console.log(chalk.gray(`  常用 type: ${style.commonTypes.join(', ')}`));
    }
  }

  const langMap: Record<string, string> = {
    zh_CN: '简体中文',
    zh_TW: '繁體中文',
    en_US: 'English',
    ja_JP: '日本語',
  };
  console.log(chalk.gray(`  主要语言: ${langMap[style.language] || style.language}`));
  console.log();
}

// 编辑 commit message
async function editCommitMessage(
  currentMsg: GeneratedCommitMessage,
): Promise<GeneratedCommitMessage | null> {
  const fullMessage = formatCommitMessage(currentMsg);

  const answers = await inquirer.prompt([
    {
      type: 'editor',
      name: 'message',
      message: '编辑 commit message（保存并关闭编辑器以继续）',
      default: fullMessage,
    },
  ]);

  const edited = answers.message.trim();
  if (!edited) {
    return null;
  }

  // 简单解析编辑后的内容
  const lines = edited.split('\n');
  const subjectLine = lines[0].trim();
  const body = lines.slice(1).join('\n').trim();

  // 尝试解析 conventional commit 格式
  let type = currentMsg.type;
  let scope = currentMsg.scope;
  let subject = subjectLine;

  const match = subjectLine.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (match) {
    type = match[1].toLowerCase();
    scope = match[2] || undefined;
    subject = match[3].trim();
  }

  return { subject, body, type, scope };
}

// 确认提交
async function confirmCommit(): Promise<'commit' | 'edit' | 'cancel'> {
  const answers = await inquirer.prompt([
    {
      type: 'expand',
      name: 'action',
      message: '确认提交吗？',
      choices: [
        { key: 'y', name: '确认提交', value: 'commit' },
        { key: 'e', name: '编辑 message', value: 'edit' },
        { key: 'n', name: '取消', value: 'cancel' },
      ],
      default: 'y',
    },
  ]);

  return answers.action;
}

// 主 commit 命令
export async function commitCommand(options: CommitCommandOptions = {}): Promise<void> {
  try {
    const isSilent = options.silence || false;

    // 1. 环境检查
    ensureGitRepo();

    if (hasMergeConflicts()) {
      throw errors.gitConflict();
    }

    ensureStagingNotEmpty();

    // 2. 配置检查
    let config: AppConfig;
    try {
      config = loadConfig();
    } catch (e) {
      // 配置不存在，如果不是静默模式，自动启动配置向导
      if (e instanceof AppError && e.code === ErrorCode.CONFIG_NOT_FOUND) {
        if (!isSilent) {
          console.log();
          console.log(chalk.yellow('ℹ 首次使用需要配置 LLM API 信息'));
          console.log();

          // 动态导入并启动配置向导
          const { configCommand } = await import('./config');
          await configCommand();

          // 配置完成后重新加载配置
          try {
            config = loadConfig();
          } catch {
            throw errors.configNotFound();
          }
        } else {
          throw errors.configNotFound();
        }
      } else {
        throw e;
      }
    }

    // 3. 获取暂存区信息
    const stagedChanges = getStagedChanges();
    if (!isSilent) {
      displayStagedFiles(stagedChanges);
    }

    // 4. 获取历史 commit 并分析风格
    const history = getCommitHistory(30);
    const historySummary = history.commits
      .slice(0, 15)
      .map((c) => c.subject)
      .join('\n');

    const style = analyzeCommitStyle(history);
    const styleInfo = formatStyleInfo(style);

    if (!isSilent) {
      displayStyleAnalysis(history, style);
    }

    // 5. 调用 LLM 生成 commit message
    const spinner = !isSilent ? createSpinner('正在生成 commit message...').start() : null;

    try {
      const llmService = new LLMService(config);
      const generatedMsg = await llmService.generateCommitMessage({
        diff: stagedChanges.rawDiff,
        config,
        commitHistory: historySummary,
        styleInfo,
      });

      if (spinner) {
        spinner.succeed('生成成功！');
      }

      // 6. 静默模式：直接提交
      if (isSilent) {
        const fullMessage = formatCommitMessage(generatedMsg);
        executeGitCommit(fullMessage);
        success('提交成功！');
        return;
      }

      // 7. 显示预览
      displayCommitPreview(generatedMsg);

      // 8. 确认/编辑循环
      let currentMsg = generatedMsg;
      let confirmed: 'commit' | 'cancel' | 'edit' | null = null;

      while (confirmed !== 'commit' && confirmed !== 'cancel') {
        confirmed = await confirmCommit();

        if (confirmed === 'edit') {
          const edited = await editCommitMessage(currentMsg);
          if (edited) {
            currentMsg = edited;
            displayCommitPreview(currentMsg);
          }
          confirmed = null; // 重置状态，继续循环
          continue;
        }

        if (confirmed === 'cancel') {
          console.log(chalk.yellow('已取消提交'));
          process.exit(10);
        }
      }

      // 9. 执行提交
      const commitSpinner = createSpinner('正在提交...').start();
      const fullMessage = formatCommitMessage(currentMsg);
      executeGitCommit(fullMessage);
      commitSpinner.succeed('提交成功！');

      console.log();
      console.log(chalk.green('✓ 提交完成'));
      console.log(chalk.gray(`  ${fullMessage.split('\n')[0]}`));
      console.log();
    } catch (e) {
      if (spinner) {
        spinner.fail('生成失败');
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof AppError) {
      displayError(getErrorTitle(e.code), e.message, e.suggestion);
      process.exit(getExitCode(e.code));
    } else {
      displayError('未知错误', e instanceof Error ? e.message : String(e), '请检查环境配置');
      process.exit(1);
    }
  }
}

// 根据错误代码获取标题
function getErrorTitle(code: ErrorCode): string {
  const titles: Record<ErrorCode, string> = {
    [ErrorCode.GIT_NOT_REPO]: '非 Git 仓库',
    [ErrorCode.GIT_STAGING_EMPTY]: '暂存区为空',
    [ErrorCode.GIT_CONFLICT]: '存在合并冲突',
    [ErrorCode.GIT_COMMAND_FAILED]: 'Git 命令失败',
    [ErrorCode.CONFIG_NOT_FOUND]: '配置缺失',
    [ErrorCode.CONFIG_INVALID]: '配置无效',
    [ErrorCode.CONFIG_SAVE_FAILED]: '配置保存失败',
    [ErrorCode.LLM_API_ERROR]: 'LLM 调用失败',
    [ErrorCode.LLM_TOKEN_LIMIT]: 'Token 超限',
    [ErrorCode.LLM_TIMEOUT]: '请求超时',
    [ErrorCode.LLM_INVALID_RESPONSE]: '响应格式错误',
    [ErrorCode.COMMIT_EMPTY_MESSAGE]: 'Message 为空',
    [ErrorCode.COMMIT_FAILED]: '提交失败',
    [ErrorCode.UNKNOWN_ERROR]: '未知错误',
  };
  return titles[code] || '错误';
}

// 根据错误代码获取退出码
function getExitCode(code: ErrorCode): number {
  const codes: Record<ErrorCode, number> = {
    [ErrorCode.GIT_NOT_REPO]: 2,
    [ErrorCode.GIT_STAGING_EMPTY]: 3,
    [ErrorCode.GIT_CONFLICT]: 1,
    [ErrorCode.GIT_COMMAND_FAILED]: 1,
    [ErrorCode.CONFIG_NOT_FOUND]: 4,
    [ErrorCode.CONFIG_INVALID]: 4,
    [ErrorCode.CONFIG_SAVE_FAILED]: 4,
    [ErrorCode.LLM_API_ERROR]: 5,
    [ErrorCode.LLM_TOKEN_LIMIT]: 5,
    [ErrorCode.LLM_TIMEOUT]: 5,
    [ErrorCode.LLM_INVALID_RESPONSE]: 5,
    [ErrorCode.COMMIT_EMPTY_MESSAGE]: 1,
    [ErrorCode.COMMIT_FAILED]: 1,
    [ErrorCode.UNKNOWN_ERROR]: 1,
  };
  return codes[code] || 1;
}
