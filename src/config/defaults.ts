import * as os from 'os';
import * as path from 'path';

// 配置接口定义
export interface AppConfig {
  baseUrl: string;
  modelName: string;
  apiKey: string;
  defaultLanguage: string;
  useSemanticCommit: boolean;
}

// 默认配置值
export const defaultConfig: AppConfig = {
  baseUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-3.5-turbo',
  apiKey: '',
  defaultLanguage: 'zh_CN',
  useSemanticCommit: true,
};

// 获取配置文件路径
export function getConfigPath(): string {
  return path.join(os.homedir(), '.smart-git-commit.json');
}

// 语言选项列表
export const languageOptions = [
  { name: '简体中文', value: 'zh_CN' },
  { name: '繁體中文', value: 'zh_TW' },
  { name: 'English', value: 'en_US' },
  { name: '日本語', value: 'ja_JP' },
];
