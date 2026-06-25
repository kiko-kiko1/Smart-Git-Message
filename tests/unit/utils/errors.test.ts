import { AppError, ErrorCode, errors } from '../../../src/utils/errors';

describe('errors', () => {
  describe('AppError', () => {
    it('应该正确创建错误实例', () => {
      const error = new AppError(
        ErrorCode.GIT_NOT_REPO,
        '当前目录不是 Git 仓库',
        '请在 Git 仓库中运行此命令',
        'details',
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.code).toBe(ErrorCode.GIT_NOT_REPO);
      expect(error.message).toBe('当前目录不是 Git 仓库');
      expect(error.suggestion).toBe('请在 Git 仓库中运行此命令');
      expect(error.details).toBe('details');
    });

    it('details 字段可选', () => {
      const error = new AppError(
        ErrorCode.UNKNOWN_ERROR,
        '未知错误',
        '请检查环境',
      );

      expect(error.details).toBeUndefined();
    });
  });

  describe('errors 工厂函数', () => {
    it('gitNotRepo 应该创建正确的错误', () => {
      const error = errors.gitNotRepo();
      expect(error.code).toBe(ErrorCode.GIT_NOT_REPO);
      expect(error.message).toContain('Git 仓库');
      expect(error.suggestion).toBeTruthy();
    });

    it('gitStagingEmpty 应该创建正确的错误', () => {
      const error = errors.gitStagingEmpty();
      expect(error.code).toBe(ErrorCode.GIT_STAGING_EMPTY);
      expect(error.message).toContain('暂存区');
      expect(error.suggestion).toBeTruthy();
    });

    it('gitConflict 应该创建正确的错误', () => {
      const error = errors.gitConflict();
      expect(error.code).toBe(ErrorCode.GIT_CONFLICT);
      expect(error.message).toContain('冲突');
      expect(error.suggestion).toBeTruthy();
    });

    it('gitCommandFailed 应该包含命令和错误信息', () => {
      const error = errors.gitCommandFailed('status', 'some error');
      expect(error.code).toBe(ErrorCode.GIT_COMMAND_FAILED);
      expect(error.message).toContain('status');
      expect(error.details).toBe('some error');
    });

    it('configNotFound 应该创建正确的错误', () => {
      const error = errors.configNotFound();
      expect(error.code).toBe(ErrorCode.CONFIG_NOT_FOUND);
      expect(error.suggestion).toContain('--config');
    });

    it('configInvalid 应该包含原因', () => {
      const error = errors.configInvalid('JSON 格式错误');
      expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
      expect(error.message).toContain('JSON 格式错误');
    });

    it('configSaveFailed 应该包含错误详情', () => {
      const error = errors.configSaveFailed('permission denied');
      expect(error.code).toBe(ErrorCode.CONFIG_SAVE_FAILED);
      expect(error.details).toBe('permission denied');
    });

    it('llmApiError 应该包含错误信息', () => {
      const error = errors.llmApiError('rate limit exceeded');
      expect(error.code).toBe(ErrorCode.LLM_API_ERROR);
      expect(error.message).toContain('rate limit exceeded');
    });

    it('llmTokenLimit 应该创建正确的错误', () => {
      const error = errors.llmTokenLimit();
      expect(error.code).toBe(ErrorCode.LLM_TOKEN_LIMIT);
      expect(error.message).toContain('token');
    });

    it('llmTimeout 应该创建正确的错误', () => {
      const error = errors.llmTimeout();
      expect(error.code).toBe(ErrorCode.LLM_TIMEOUT);
      expect(error.message).toContain('超时');
    });

    it('llmInvalidResponse 应该创建正确的错误', () => {
      const error = errors.llmInvalidResponse();
      expect(error.code).toBe(ErrorCode.LLM_INVALID_RESPONSE);
      expect(error.message).toContain('格式');
    });

    it('commitEmptyMessage 应该创建正确的错误', () => {
      const error = errors.commitEmptyMessage();
      expect(error.code).toBe(ErrorCode.COMMIT_EMPTY_MESSAGE);
      expect(error.message).toContain('不能为空');
    });

    it('commitFailed 应该包含错误详情', () => {
      const error = errors.commitFailed('nothing to commit');
      expect(error.code).toBe(ErrorCode.COMMIT_FAILED);
      expect(error.details).toBe('nothing to commit');
    });

    it('unknown 应该创建通用错误', () => {
      const error = errors.unknown('something broke');
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.details).toBe('something broke');
    });
  });
});
