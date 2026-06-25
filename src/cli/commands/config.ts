import * as inquirer from 'inquirer';
import chalk from 'chalk';

import {
  saveConfig,
  loadConfig,
  defaultConfig,
  getConfigPath,
  AppConfig,
  languageOptions,
} from '../../config';
import { success, title } from '../ui/spinner';

// 配置向导
export async function configCommand(): Promise<void> {
  title('⚙️  Smart Git Commit 配置向导');

  console.log();
  console.log(`配置文件路径: ${chalk.cyan(getConfigPath())}`);
  console.log();

  // 尝试加载现有配置作为默认值
  let existingConfig: AppConfig | null = null;
  try {
    existingConfig = loadConfig();
  } catch {
    // 配置不存在或无效，使用默认值
  }

  const defaults = existingConfig || defaultConfig;

  const questions = [
    {
      type: 'input',
      name: 'baseUrl',
      message: '请输入 LLM API 基础地址',
      default: defaults.baseUrl,
      validate: (input: string) => {
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
          return '地址必须以 http:// 或 https:// 开头';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'modelName',
      message: '请输入模型名称',
      default: defaults.modelName,
      validate: (input: string) => {
        if (input.trim() === '') {
          return '模型名称不能为空';
        }
        return true;
      },
    },
    {
      type: 'password',
      name: 'apiKey',
      message: '请输入 API Key',
      default: defaults.apiKey,
      mask: '*',
      validate: (input: string) => {
        if (input.trim() === '') {
          return 'API Key 不能为空';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'defaultLanguage',
      message: '请选择 commit message 默认语言',
      choices: languageOptions.map((opt) => ({
        name: opt.name,
        value: opt.value,
      })),
      default: defaults.defaultLanguage,
    },
    {
      type: 'confirm',
      name: 'useSemanticCommit',
      message: '是否启用 Semantic Git Commit 规则？',
      default: defaults.useSemanticCommit,
    },
  ];

  const answers = await inquirer.prompt(questions);

  const newConfig: AppConfig = {
    baseUrl: answers.baseUrl.trim(),
    modelName: answers.modelName.trim(),
    apiKey: answers.apiKey.trim(),
    defaultLanguage: answers.defaultLanguage,
    useSemanticCommit: answers.useSemanticCommit,
  };

  // 保存配置
  saveConfig(newConfig);

  console.log();
  success('配置已保存！');
  console.log();
  console.log(chalk.gray('配置文件位置: ' + getConfigPath()));
  console.log();
  console.log(chalk.green('现在可以使用 smart-git-commit 生成 commit message 了！'));
  console.log();
}
