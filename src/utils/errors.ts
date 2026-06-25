// 错误代码枚举
export enum ErrorCode {
  // Git 相关错误
  GIT_NOT_REPO = 'GIT_NOT_REPO',
  GIT_STAGING_EMPTY = 'GIT_STAGING_EMPTY',
  GIT_CONFLICT = 'GIT_CONFLICT',
  GIT_COMMAND_FAILED = 'GIT_COMMAND_FAILED',

  // 配置相关错误
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_SAVE_FAILED = 'CONFIG_SAVE_FAILED',

  // LLM 相关错误
  LLM_API_ERROR = 'LLM_API_ERROR',
  LLM_TOKEN_LIMIT = 'LLM_TOKEN_LIMIT',
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  LLM_INVALID_RESPONSE = 'LLM_INVALID_RESPONSE',

  // 提交相关错误
  COMMIT_EMPTY_MESSAGE = 'COMMIT_EMPTY_MESSAGE',
  COMMIT_FAILED = 'COMMIT_FAILED',

  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 应用错误类
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly suggestion: string;
  public readonly details?: string;

  constructor(code: ErrorCode, message: string, suggestion: string, details?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.suggestion = suggestion;
    this.details = details;
  }
}

// 预定义错误工厂函数
export const errors = {
  // Git 错误
  gitNotRepo: (): AppError =>
    new AppError(
      ErrorCode.GIT_NOT_REPO,
      '当前目录不是 Git 仓库',
      '请在 Git 仓库中运行此命令，或使用 git init 初始化仓库',
    ),

  gitStagingEmpty: (): AppError =>
    new AppError(
      ErrorCode.GIT_STAGING_EMPTY,
      '暂存区为空',
      '请使用 git add <file> 将文件添加到暂存区后再试',
    ),

  gitConflict: (): AppError =>
    new AppError(
      ErrorCode.GIT_CONFLICT,
      '存在未解决的合并冲突',
      '请先解决所有冲突，然后使用 git add 标记为已解决',
    ),

  gitCommandFailed: (command: string, error: string): AppError =>
    new AppError(
      ErrorCode.GIT_COMMAND_FAILED,
      `Git 命令执行失败: ${command}`,
      '请检查 git 是否正确安装，以及仓库状态是否正常',
      error,
    ),

  // 配置错误
  configNotFound: (): AppError =>
    new AppError(
      ErrorCode.CONFIG_NOT_FOUND,
      '未检测到配置文件',
      '运行 smart-git-commit --config 进行配置，或设置 OPENAI_API_KEY 环境变量',
    ),

  configInvalid: (reason: string): AppError =>
    new AppError(
      ErrorCode.CONFIG_INVALID,
      `配置文件格式错误: ${reason}`,
      '运行 smart-git-commit --config 重新配置，或手动修复 ~/.smart-git-commit.json',
    ),

  configSaveFailed: (error: string): AppError =>
    new AppError(ErrorCode.CONFIG_SAVE_FAILED, '配置保存失败', '请检查文件系统权限是否正常', error),

  // LLM 错误
  llmApiError: (message: string): AppError =>
    new AppError(
      ErrorCode.LLM_API_ERROR,
      `LLM API 调用失败: ${message}`,
      '请检查 API Key 是否有效、网络连接是否正常、base_url 配置是否正确',
    ),

  llmTokenLimit: (): AppError =>
    new AppError(
      ErrorCode.LLM_TOKEN_LIMIT,
      '内容超过模型 token 限制',
      '请减少暂存区的文件数量，或尝试分批提交',
    ),

  llmTimeout: (): AppError =>
    new AppError(ErrorCode.LLM_TIMEOUT, 'LLM 请求超时', '请检查网络连接，或稍后重试'),

  llmInvalidResponse: (): AppError =>
    new AppError(
      ErrorCode.LLM_INVALID_RESPONSE,
      'LLM 返回格式异常',
      '请重试，如果问题持续请尝试更换模型',
    ),

  // 提交错误
  commitEmptyMessage: (): AppError =>
    new AppError(
      ErrorCode.COMMIT_EMPTY_MESSAGE,
      'commit message 不能为空',
      '请输入有效的 commit message',
    ),

  commitFailed: (error: string): AppError =>
    new AppError(ErrorCode.COMMIT_FAILED, 'Git 提交失败', '请检查暂存区状态和 git 配置', error),

  // 通用错误
  unknown: (error: string): AppError =>
    new AppError(
      ErrorCode.UNKNOWN_ERROR,
      '发生未知错误',
      '请检查环境配置，或提交 issue 反馈问题',
      error,
    ),
};
