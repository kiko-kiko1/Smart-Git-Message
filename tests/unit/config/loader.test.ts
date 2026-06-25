import { validateConfig } from '../../../src/config/loader';
import { AppConfig, defaultConfig, getConfigPath } from '../../../src/config/defaults';

describe('config', () => {
  describe('defaultConfig', () => {
    it('应该包含所有必要的字段', () => {
      expect(defaultConfig.baseUrl).toBeDefined();
      expect(defaultConfig.modelName).toBeDefined();
      expect(defaultConfig.apiKey).toBeDefined();
      expect(defaultConfig.defaultLanguage).toBeDefined();
      expect(defaultConfig.useSemanticCommit).toBeDefined();
    });

    it('默认值应该合理', () => {
      expect(defaultConfig.baseUrl).toContain('openai.com');
      expect(defaultConfig.apiKey).toBe('');
      expect(defaultConfig.useSemanticCommit).toBe(true);
      expect(defaultConfig.defaultLanguage).toBe('zh_CN');
    });
  });

  describe('getConfigPath', () => {
    it('应该返回用户主目录下的配置文件路径', () => {
      const path = getConfigPath();
      expect(path).toContain('.smart-git-commit.json');
    });
  });

  describe('validateConfig', () => {
    const validConfig: AppConfig = {
      baseUrl: 'https://api.openai.com/v1',
      modelName: 'gpt-3.5-turbo',
      apiKey: 'sk-test-key',
      defaultLanguage: 'zh_CN',
      useSemanticCommit: true,
    };

    it('有效的配置应该返回 true', () => {
      expect(validateConfig(validConfig)).toBe(true);
    });

    it('null 应该返回 false', () => {
      expect(validateConfig(null)).toBe(false);
    });

    it('非对象应该返回 false', () => {
      expect(validateConfig('string')).toBe(false);
      expect(validateConfig(123)).toBe(false);
      expect(validateConfig(undefined)).toBe(false);
    });

    it('缺少 baseUrl 应该返回 false', () => {
      const { baseUrl, ...rest } = validConfig;
      expect(validateConfig(rest)).toBe(false);
    });

    it('无效的 baseUrl 应该返回 false', () => {
      expect(validateConfig({ ...validConfig, baseUrl: 'not-a-url' })).toBe(false);
    });

    it('空的 modelName 应该返回 false', () => {
      expect(validateConfig({ ...validConfig, modelName: '' })).toBe(false);
    });

    it('apiKey 不是字符串应该返回 false', () => {
      expect(validateConfig({ ...validConfig, apiKey: 123 as unknown as string })).toBe(false);
    });

    it('空的 defaultLanguage 应该返回 false', () => {
      expect(validateConfig({ ...validConfig, defaultLanguage: '' })).toBe(false);
    });

    it('useSemanticCommit 不是布尔值应该返回 false', () => {
      expect(validateConfig({ ...validConfig, useSemanticCommit: 'true' as unknown as boolean })).toBe(false);
    });

    it('空的 apiKey 应该是有效的', () => {
      expect(validateConfig({ ...validConfig, apiKey: '' })).toBe(true);
    });
  });
});
