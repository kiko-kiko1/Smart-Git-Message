import * as fs from 'fs';
import { AppConfig, getConfigPath } from './defaults';
import { errors } from '../utils/errors';
import { validateConfig } from './loader';

// 保存配置到文件
export function saveConfig(config: AppConfig): void {
  // 先验证配置
  if (!validateConfig(config)) {
    throw errors.configInvalid('配置验证失败');
  }

  const configPath = getConfigPath();

  try {
    // 确保目录存在（一般在用户主目录下，应该都存在）
    const dir = configPath.replace(/[^/]+$/, '');
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件，格式化输出
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

    // 设置文件权限为仅用户可读写
    try {
      fs.chmodSync(configPath, 0o600);
    } catch {
      // 忽略权限设置失败（某些系统可能不支持）
    }
  } catch (e) {
    throw errors.configSaveFailed(e instanceof Error ? e.message : String(e));
  }
}
