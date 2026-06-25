import {
  estimateTokens,
  truncateText,
  truncateDiff,
  extractFileList,
} from '../../../src/utils/token-counter';

describe('token-counter', () => {
  describe('estimateTokens', () => {
    it('空字符串应该返回 0', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('应该按字符数估算 token（约 4 字符 = 1 token）', () => {
      expect(estimateTokens('hello world')).toBeGreaterThan(0);
      expect(estimateTokens('hello world')).toBeLessThan(10);
    });

    it('长文本的 token 估算应该合理', () => {
      const longText = 'a'.repeat(1000);
      const tokens = estimateTokens(longText);
      expect(tokens).toBeCloseTo(250, -1); // 约 250 tokens
    });
  });

  describe('truncateText', () => {
    it('文本在限制内时不截断', () => {
      const text = 'short text';
      const result = truncateText(text, { maxTokens: 100 });
      expect(result).toBe(text);
    });

    it('文本超过限制时应该截断', () => {
      const longText = 'a'.repeat(1000);
      const result = truncateText(longText, { maxTokens: 50 });
      expect(estimateTokens(result)).toBeLessThanOrEqual(50 + 10); // 容差
      expect(result).toContain('...');
    });

    it('应该保留顶部和底部内容', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`);
      const text = lines.join('\n');
      const result = truncateText(text, { maxTokens: 30, reserveTop: 5, reserveBottom: 5 });

      expect(result).toContain('line 0');
      expect(result).toContain('line 99');
      expect(result).toContain('省略');
    });
  });

  describe('extractFileList', () => {
    it('应该从 diff 中提取文件列表', () => {
      const diff = `diff --git a/src/file1.ts b/src/file1.ts
index 123..456 100644
--- a/src/file1.ts
+++ b/src/file1.ts
@@ -1,3 +1,3 @@
-old
+new

diff --git a/src/file2.ts b/src/file2.ts
index 789..abc 100644
--- a/src/file2.ts
+++ b/src/file2.ts
@@ -1,3 +1,3 @@
-old2
+new2`;

      const files = extractFileList(diff);
      expect(files).toHaveLength(2);
      expect(files).toContain('src/file1.ts');
      expect(files).toContain('src/file2.ts');
    });

    it('空 diff 应该返回空数组', () => {
      expect(extractFileList('')).toEqual([]);
    });
  });

  describe('truncateDiff', () => {
    it('diff 在限制内时不截断', () => {
      const diff = 'short diff';
      const result = truncateDiff(diff, { maxTokens: 100 });
      expect(result).toBe(diff);
    });

    it('应该限制文件数量', () => {
      let diff = '';
      for (let i = 0; i < 30; i++) {
        diff += `diff --git a/file${i}.ts b/file${i}.ts\n--- a/file${i}.ts\n+++ b/file${i}.ts\n+added line\n-removed line\n+more content here\n`;
      }

      // 使用较小的 token 限制来触发文件截断
      const result = truncateDiff(diff, { maxTokens: 50, maxFiles: 10 });
      const files = extractFileList(result);
      expect(files.length).toBeLessThanOrEqual(10);
    });

    it('应该限制每个文件的行数', () => {
      let diff = 'diff --git a/bigfile.ts b/bigfile.ts\n--- a/bigfile.ts\n+++ b/bigfile.ts\n';
      for (let i = 0; i < 100; i++) {
        diff += `+line ${i}\n`;
      }

      const result = truncateDiff(diff, { maxTokens: 100, maxLinesPerFile: 20 });
      const lines = result.split('\n');
      // 应该比原始的 103 行少
      expect(lines.length).toBeLessThan(103);
      expect(result).toContain('截断');
    });
  });
});
