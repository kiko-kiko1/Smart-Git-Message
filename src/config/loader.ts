import * as fs from 'fs';
import { AppConfig, defaultConfig, getConfigPath } from './defaults';
import { errors } from '../utils/errors';

// 验证配置对象的有效性
export function validateConfig(config: unknown): config is AppConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  if (typeof c.baseUrl !== 'string' || !c.baseUrl.startsWith('http')) {
    return false;
  }
  if (typeof c.modelName !== 'string' || c.modelName.trim() === '') {
    return false;
  }
  if (typeof c.apiKey !== 'string') {
    return false;
  }
  if (typeof c.defaultLanguage !== 'string' || c.defaultLanguage.trim() === '') {
    return false;
  }
  if (typeof c.useSemanticCommit !== 'boolean') {
    return false;
  }

  return true;
}

// 从环境变量中读取配置
function loadFromEnv(): Partial<AppConfig> {
  const envConfig: Partial<AppConfig> = {};

  if (process.env.OPENAI_API_KEY) {
    envConfig.apiKey = process.env.OPENAI_API_KEY;
  }
  if (process.env.OPENAI_BASE_URL) {
    envConfig.baseUrl = process.env.OPENAI_BASE_URL;
  }
  if (process.env.OPENAI_MODEL_NAME) {
    envConfig.modelName = process.env.OPENAI_MODEL_NAME;
  }

  return envConfig;
}

// 从文件加载配置
export function loadConfig(): AppConfig {
  const configPath = getConfigPath();
  const envConfig = loadFromEnv();

  // 尝试读取配置文件
  let fileConfig: Partial<AppConfig> = {};
  let fileExists = false;

  if (fs.existsSync(configPath)) {
    fileExists = true;
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!validateConfig(parsed)) {
        throw errors.configInvalid('配置字段不完整或类型错误');
      }
      fileConfig = parsed;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw errors.configInvalid('JSON 格式错误');
      }
      throw e;
    }
  }

  // 合并配置：默认值 < 文件配置 < 环境变量
  const merged: AppConfig = {
    ...defaultConfig,
    ...fileConfig,
    ...envConfig,
  };

  // 如果配置文件不存在且环境变量中也没有 apiKey，抛出配置不存在错误
  if (!fileExists && !envConfig.apiKey && !fileConfig.apiKey) {
    throw errors.configNotFound();
  }

  return merged;
}

// 检查配置文件是否存在
export function configFileExists(): boolean {
  return fs.existsSync(getConfigPath());
}
