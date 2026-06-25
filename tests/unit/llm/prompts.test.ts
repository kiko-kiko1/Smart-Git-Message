import { buildCommitMessages, parseCommitMessage } from '../../../src/llm/prompts/commit';

describe('commit prompts', () => {
  describe('buildCommitMessages', () => {
    it('应该构建系统消息和用户消息', () => {
      const messages = buildCommitMessages({
        diff: 'diff content',
        language: 'zh_CN',
        useSemantic: true,
      });

      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    it('系统消息应该包含语言信息', () => {
      const messages = buildCommitMessages({
        diff: 'test',
        language: 'zh_CN',
        useSemantic: false,
      });

      expect(messages[0].content).toContain('简体中文');
    });

    it('系统消息应该包含 Conventional Commits 规范', () => {
      const messages = buildCommitMessages({
        diff: 'test',
        language: 'en_US',
        useSemantic: true,
      });

      expect(messages[0].content).toContain('Conventional Commits');
      expect(messages[0].content).toContain('feat');
      expect(messages[0].content).toContain('fix');
    });

    it('用户消息应该包含 diff 内容', () => {
      const diff = 'some diff content here';
      const messages = buildCommitMessages({
        diff,
        language: 'en_US',
        useSemantic: false,
      });

      expect(messages[1].content).toContain(diff);
    });

    it('用户消息应该包含历史 commit（如果提供）', () => {
      const history = 'feat: add feature\nfix: bug fix';
      const messages = buildCommitMessages({
        diff: 'test',
        language: 'en_US',
        useSemantic: false,
        commitHistory: history,
      });

      expect(messages[1].content).toContain(history);
    });

    it('系统消息应该包含风格信息（如果提供）', () => {
      const styleInfo = '- 使用 Conventional Commits 格式\n- 常用 type: feat, fix';
      const messages = buildCommitMessages({
        diff: 'test',
        language: 'en_US',
        useSemantic: false,
        styleInfo,
      });

      expect(messages[0].content).toContain(styleInfo);
    });
  });

  describe('parseCommitMessage', () => {
    it('应该解析简单的 subject', () => {
      const result = parseCommitMessage('add new feature');
      expect(result.subject).toBe('add new feature');
      expect(result.body).toBe('');
      expect(result.type).toBeUndefined();
      expect(result.scope).toBeUndefined();
    });

    it('应该解析 Conventional Commits 格式', () => {
      const result = parseCommitMessage('feat: add new feature');
      expect(result.type).toBe('feat');
      expect(result.subject).toBe('add new feature');
      expect(result.scope).toBeUndefined();
    });

    it('应该解析带 scope 的 Conventional Commits 格式', () => {
      const result = parseCommitMessage('fix(auth): login bug');
      expect(result.type).toBe('fix');
      expect(result.scope).toBe('auth');
      expect(result.subject).toBe('login bug');
    });

    it('应该解析带 body 的 message', () => {
      const message = `feat: add feature

detailed description
of the changes

more details`;
      const result = parseCommitMessage(message);
      expect(result.type).toBe('feat');
      expect(result.subject).toBe('add feature');
      expect(result.body).toContain('detailed description');
      expect(result.body).toContain('more details');
    });

    it('type 应该转小写', () => {
      const result = parseCommitMessage('FEAT: add feature');
      expect(result.type).toBe('feat');
    });

    it('空字符串应该返回空结果', () => {
      const result = parseCommitMessage('');
      expect(result.subject).toBe('');
    });

    it('应该处理前后空白字符', () => {
      const result = parseCommitMessage('  fix: bug  \n');
      expect(result.type).toBe('fix');
      expect(result.subject).toBe('bug');
    });
  });
});
