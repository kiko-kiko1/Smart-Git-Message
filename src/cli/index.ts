import { Command } from 'commander';
import { commitCommand } from './commands/commit';
import { helpCommand } from './commands/help';

const program = new Command();

program
  .name('smart-git-commit')
  .description('使用 LLM 自动生成 Git Commit Message 的 CLI 工具')
  .version('0.1.0', '-v, --version', '显示版本号')
  .option('-s, --silence', '静默模式，跳过预览直接提交')
  .option('-c, --config', '启动交互式配置向导')
  .option('-h, --help', '显示帮助信息')
  .action((options) => {
    // 如果指定了 --help
    if (options.help) {
      helpCommand();
      return;
    }

    // 如果指定了 --config
    if (options.config) {
      import('./commands/config').then(({ configCommand }) => {
        configCommand();
      });
      return;
    }

    // 否则执行默认的 commit 命令
    commitCommand({ silence: options.silence });
  });

// 覆盖 commander 的默认 help 输出
program.addHelpText('before', '');
program.addHelpText('after', '');
program.helpOption(false); // 禁用默认的 --help，我们自己实现

export { program };
