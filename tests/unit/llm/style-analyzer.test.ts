import {
  analyzeCommitStyle,
  formatStyleInfo,
  CommitStyle,
} from '../../../src/llm/style-analyzer';
import { CommitHistory } from '../../../src/git/history';

describe('style-analyzer', () => {
  const emptyHistory: CommitHistory = {
    commits: [],
    totalCount: 0,
  };

  describe('analyzeCommitStyle', () => {
    it('空历史应该返回默认风格', () => {
      const style = analyzeCommitStyle(emptyHistory);
      expect(style.usesConventionalCommits).toBe(false);
      expect(style.commonTypes).toEqual([]);
      expect(style.language).toBe('en_US');
      expect(style.hasScope).toBe(false);
      expect(style.hasBody).toBe(false);
    });

    it('应该检测 Conventional Commits 风格', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: 'feat: add new feature', body: '', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: 'fix: bug fix', body: '', author: 'test', date: '2024-01-02' },
          { hash: 'c3d4e5f', subject: 'docs: update readme', body: '', author: 'test', date: '2024-01-03' },
          { hash: 'd4e5f6g', subject: 'style: format code', body: '', author: 'test', date: '2024-01-04' },
          { hash: 'e5f6g7h', subject: 'random message', body: '', author: 'test', date: '2024-01-05' },
        ],
        totalCount: 5,
      };

      const style = analyzeCommitStyle(history);
      expect(style.usesConventionalCommits).toBe(true);
      expect(style.commonTypes).toContain('feat');
      expect(style.commonTypes).toContain('fix');
    });

    it('应该检测 scope 的使用', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: 'feat(api): add endpoint', body: '', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: 'fix(ui): button issue', body: '', author: 'test', date: '2024-01-02' },
          { hash: 'c3d4e5f', subject: 'docs: update readme', body: '', author: 'test', date: '2024-01-03' },
          { hash: 'd4e5f6g', subject: 'refactor(core): rewrite', body: '', author: 'test', date: '2024-01-04' },
          { hash: 'e5f6g7h', subject: 'test: add tests', body: '', author: 'test', date: '2024-01-05' },
        ],
        totalCount: 5,
      };

      const style = analyzeCommitStyle(history);
      expect(style.hasScope).toBe(true);
    });

    it('应该检测中文 commit', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: '添加用户登录功能', body: '', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: '修复首页显示问题', body: '', author: 'test', date: '2024-01-02' },
          { hash: 'c3d4e5f', subject: '更新文档', body: '', author: 'test', date: '2024-01-03' },
        ],
        totalCount: 3,
      };

      const style = analyzeCommitStyle(history);
      expect(style.language).toBe('zh_CN');
    });

    it('应该检测英文 commit', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: 'add user login feature', body: '', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: 'fix homepage display issue', body: '', author: 'test', date: '2024-01-02' },
        ],
        totalCount: 2,
      };

      const style = analyzeCommitStyle(history);
      expect(style.language).toBe('en_US');
    });

    it('应该统计 subject 长度', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: 'short', body: '', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: 'a longer commit message here', body: '', author: 'test', date: '2024-01-02' },
        ],
        totalCount: 2,
      };

      const style = analyzeCommitStyle(history);
      expect(style.subjectLength.avg).toBeGreaterThan(0);
      expect(style.subjectLength.max).toBeGreaterThan(style.subjectLength.avg);
    });

    it('应该检测 body 的使用', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: 'feat: add feature', body: 'detailed description\nof the feature', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: 'fix: bug', body: 'more details here', author: 'test', date: '2024-01-02' },
          { hash: 'c3d4e5f', subject: 'docs: update', body: '', author: 'test', date: '2024-01-03' },
        ],
        totalCount: 3,
      };

      const style = analyzeCommitStyle(history);
      expect(style.hasBody).toBe(true);
    });

    it('非 conventional commits 应该返回 false', () => {
      const history: CommitHistory = {
        commits: [
          { hash: 'a1b2c3d', subject: 'update stuff', body: '', author: 'test', date: '2024-01-01' },
          { hash: 'b2c3d4e', subject: 'fix things', body: '', author: 'test', date: '2024-01-02' },
          { hash: 'c3d4e5f', subject: 'more changes', body: '', author: 'test', date: '2024-01-03' },
        ],
        totalCount: 3,
      };

      const style = analyzeCommitStyle(history);
      expect(style.usesConventionalCommits).toBe(false);
      expect(style.commonTypes).toEqual([]);
    });
  });

  describe('formatStyleInfo', () => {
    it('应该格式化风格信息为文本', () => {
      const style: CommitStyle = {
        usesConventionalCommits: true,
        commonTypes: ['feat', 'fix', 'docs'],
        language: 'zh_CN',
        hasScope: true,
        hasBody: false,
        subjectLength: { avg: 30, max: 72 },
      };

      const info = formatStyleInfo(style);
      expect(info).toContain('Conventional Commits');
      expect(info).toContain('feat');
      expect(info).toContain('fix');
      expect(info).toContain('scope');
      expect(info).toContain('zh_CN');
    });

    it('不使用 conventional commits 时不包含相关信息', () => {
      const style: CommitStyle = {
        usesConventionalCommits: false,
        commonTypes: [],
        language: 'en_US',
        hasScope: false,
        hasBody: false,
        subjectLength: { avg: 20, max: 50 },
      };

      const info = formatStyleInfo(style);
      expect(info).not.toContain('Conventional Commits');
    });
  });
});
