import ora from 'ora';
import chalk from 'chalk';

// Loading 指示器封装
export function createSpinner(text: string) {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots',
  });
}

// 成功提示
export function success(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

// 错误提示
export function error(message: string): void {
  console.log(chalk.red(`✗ ${message}`));
}

// 警告提示
export function warning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

// 信息提示
export function info(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

// 格式化错误显示
export function displayError(title: string, description: string, suggestion?: string): void {
  console.log();
  console.log(chalk.red.bold(`✗ ${title}`));
  console.log();
  console.log(description);
  if (suggestion) {
    console.log();
    console.log(chalk.yellow(`💡 建议：${suggestion}`));
  }
  console.log();
}

// 分割线
export function separator(char: string = '━'): string {
  const width = Math.min(process.stdout.columns || 80, 100);
  return chalk.gray(char.repeat(width - 4));
}

// 标题样式
export function title(text: string): void {
  console.log();
  console.log(chalk.bold.cyan(text));
  console.log(separator());
}

// 代码样式
export function code(text: string): string {
  return chalk.cyanBright(text);
}
