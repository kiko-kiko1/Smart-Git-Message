import chalk from 'chalk';

// 显示帮助信息
export function helpCommand(): void {
  console.log();
  console.log(chalk.bold.cyan('Smart Git Commit'));
  console.log(chalk.gray('智能生成 Git Commit Message 的 CLI 工具'));
  console.log();

  console.log(chalk.bold('使用方法:'));
  console.log('  smart-git-commit [options]');
  console.log();

  console.log(chalk.bold('选项:'));
  console.log(`  ${chalk.cyan('-s, --silence')}     静默模式，跳过预览和编辑，直接提交`);
  console.log(`  ${chalk.cyan('-c, --config')}      启动交互式配置向导`);
  console.log(`  ${chalk.cyan('-h, --help')}        显示帮助信息`);
  console.log(`  ${chalk.cyan('-v, --version')}     显示版本号`);
  console.log();

  console.log(chalk.bold('示例:'));
  console.log(`  ${chalk.green('smart-git-commit')}            生成 commit message 并预览提交`);
  console.log(`  ${chalk.green('smart-git-commit -s')}         静默模式，直接提交`);
  console.log(`  ${chalk.green('smart-git-commit --config')}   配置工具`);
  console.log();

  console.log(chalk.bold('配置文件:'));
  console.log(`  ${chalk.cyan('~/.smart-git-commit.json')}`);
  console.log();

  console.log(chalk.bold('环境变量:'));
  console.log(`  ${chalk.cyan('OPENAI_API_KEY')}     API 密钥（优先级高于配置文件）`);
  console.log(`  ${chalk.cyan('OPENAI_BASE_URL')}    API 基础地址（优先级高于配置文件）`);
  console.log();

  console.log(chalk.gray('项目地址: https://github.com/your-org/smart-git-commit'));
  console.log();
}
