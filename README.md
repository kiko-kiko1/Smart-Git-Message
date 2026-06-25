# Smart Git Commit

> 一个使用 LLM 自动生成高质量 Git Commit Message 的 CLI 工具。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#贡献代码)

不要再浪费时间手写 commit message 了。让 AI 分析你的代码变更，自动生成描述清晰、风格一致、符合项目习惯的提交信息。

## ✨ 功能特性

- **🤖 AI 驱动**：基于 OpenAI 兼容的 LLM 接口，根据暂存区变更生成 commit message
- **🎯 风格学习**：分析项目的 commit 历史，自动模仿项目的提交风格
- **📝 预览编辑**：提交前可以预览和编辑生成的 message
- **⚡ 静默模式**：适合信任 AI 的高级用户，一键直接提交
- **🔧 交互式配置**：首次使用提供简单的配置向导
- **🌍 多语言支持**：支持中文、英文、日文等多种语言生成
- **📏 语义化提交**：内置 Conventional Commits 规范支持
- **🛡️ 智能截断**：自动处理超大 diff，避免超出 token 限制

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Git
- 一个 OpenAI 兼容的 API Key

### 安装

```bash
npm install -g smart-git-commit
```

### 基本使用

```bash
# 将文件添加到暂存区
git add .

# 生成 commit message 并提交
smart-git-commit
```

### 首次配置

运行工具后，它会引导你完成配置：

```bash
smart-git-commit --config
```

或者通过环境变量配置：

```bash
export OPENAI_API_KEY="你的-api-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

## 📖 使用说明

### 命令列表

| 命令 | 说明 |
|------|------|
| `smart-git-commit` | 根据暂存区变更生成 commit message |
| `smart-git-commit -s, --silence` | 静默模式，跳过预览直接提交 |
| `smart-git-commit -c, --config` | 启动交互式配置向导 |
| `smart-git-commit -h, --help` | 显示帮助信息 |
| `smart-git-commit -v, --version` | 显示版本号 |

### 短命令

你也可以使用更短的别名：

```bash
zzz
```

### 使用示例

**常规流程（带预览）：**

```bash
$ git add src/app.ts
$ smart-git-commit

📋 3 个文件已暂存 (+42 -8)
   修改 src/app.ts +25 -5
   新增 src/utils.ts +12 -0
   修改 tests/app.test.ts +5 -3

🤖 正在分析 commit 历史风格...
✓ 检测到 Conventional Commits 风格
   常用类型：feat, fix, docs, refactor

⏳ 正在生成 commit message...

✓ 生成完成！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Commit Message:

feat(app): 添加用户认证流程

- 实现登录和注册功能
- 添加 JWT token 验证
- 使用 bcrypt 进行密码哈希
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? 确认提交？(使用方向键选择)
❯ 确认提交 (Y)
  编辑消息 (e)
  取消 (n)
```

**静默模式：**

```bash
$ git add . && smart-git-commit -s
✓ 提交成功！
```

## ⚙️ 配置说明

配置文件位置：`~/.smart-git-commit.json`

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `baseUrl` | `https://api.openai.com/v1` | LLM API 基础地址 |
| `modelName` | `gpt-3.5-turbo` | 模型名称 |
| `apiKey` | `""` | API 密钥 |
| `defaultLanguage` | `"zh_CN"` | Commit message 语言 |
| `useSemanticCommit` | `true` | 是否启用 Conventional Commits 格式 |

### 支持的语言

- `zh_CN` - 简体中文
- `zh_TW` - 繁體中文
- `en_US` - English
- `ja_JP` - 日本語

## 🏗️ 工作原理

1. **环境检查**：验证当前目录是否为 git 仓库，以及暂存区是否有变更
2. **Diff 收集**：收集暂存区文件变更和统计信息
3. **风格分析**：分析近期 commit，匹配项目的提交风格
4. **LLM 生成**：将 diff 和风格信息发送给 AI 生成 message
5. **预览编辑**：展示生成结果，允许用户修改调整
6. **执行提交**：使用最终的 message 执行 `git commit`

## 🧰 开发指南

### 环境搭建

```bash
# 克隆仓库
git clone https://github.com/your-org/smart-git-commit.git
cd smart-git-commit

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 运行测试（带覆盖率）
npm run test:coverage
```

### 项目结构

```
src/
├── cli/              # CLI 界面逻辑
│   ├── commands/     # 各命令实现
│   └── ui/           # UI 组件（loading、颜色等）
├── llm/              # LLM 集成
│   ├── prompts/      # Prompt 模板
│   ├── client.ts     # API 客户端
│   └── style-analyzer.ts  # 风格分析器
├── git/              # Git 操作
│   ├── staging.ts    # 暂存区操作
│   ├── diff.ts       # Diff 分析
│   └── history.ts    # 历史记录
├── config/           # 配置管理
├── utils/            # 工具函数
│   ├── errors.ts     # 错误处理
│   └── token-counter.ts  # Token 计数
└── index.ts          # 入口文件
```

## 🤝 贡献代码

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的改动 (`git commit -m 'feat: 添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 📄 许可证

MIT © Smart Git Commit 贡献者
# Smart-Git-Message
