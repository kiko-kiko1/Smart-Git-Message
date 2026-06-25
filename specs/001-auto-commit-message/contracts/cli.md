# CLI Interface Contract: Smart Git Commit

**Date**: 2026-06-23
**Feature**: 自动生成 Git Commit Message

## 概述

本文档定义 Smart Git Commit 工具的命令行接口契约，包括所有命令、参数、选项和输出格式。

---

## 1. 命令概览

| 命令 | 说明 |
|------|------|
| `smart-git-commit` | 默认命令，生成并提交 commit message |
| `smart-git-commit --config` | 交互式配置向导 |
| `smart-git-commit --help` | 显示帮助信息 |
| `smart-git-commit --silence` | 静默模式，跳过预览直接提交 |
| `smart-git-commit --version` | 显示版本号 |

---

## 2. 默认命令 (Commit)

### 用法

```bash
smart-git-commit [options]
```

### 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--silence, -s` | `boolean` | `false` | 静默模式，跳过预览和编辑，直接提交 |
| `--config, -c` | `boolean` | `false` | 启动交互式配置向导 |
| `--help, -h` | `boolean` | `false` | 显示帮助信息 |
| `--version, -v` | `boolean` | `false` | 显示版本号 |

### 执行流程

1. **环境检查**
   - 检查是否在 git 仓库中
   - 检查暂存区是否为空
   - 检查配置文件是否存在（不存在则自动进入配置向导）

2. **信息收集**
   - 获取暂存区 diff
   - 获取历史 commit 记录
   - 分析 commit 风格

3. **生成 commit message**
   - 显示 loading 指示器
   - 调用 LLM 生成 message
   - 处理可能的错误（超时、API 错误等）

4. **预览与编辑（非静默模式）**
   - 显示生成的 commit message
   - 询问用户是否编辑
   - 如选择编辑，打开编辑器或行内编辑
   - 确认后执行提交

5. **提交**
   - 执行 `git commit -m <message>`
   - 显示提交结果

### 输出示例（正常流程）

```
📋 检测到暂存区有 3 个文件变更：
   - src/utils/errors.ts (modified, +15 -2)
   - src/cli/commands/commit.ts (modified, +42 -8)
   - README.md (modified, +3 -1)

🤖 正在分析历史 commit 风格...
✓ 检测到项目使用 Conventional Commits 风格
✓ 主要语言：中文
✓ 常用 type: feat, fix, docs, refactor

⏳ 正在生成 commit message...

✓ 生成成功！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 生成的 commit message:

feat(cli): 优化 commit 命令的错误处理

- 增加 LLM 调用超时的友好提示
- 统一错误信息格式，提供解决建议
- 修复配置文件损坏时的崩溃问题
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? 确认提交吗？ (Y/n/e) 
  Y = 确认提交
  n = 取消
  e = 编辑 message
```

### 退出码

| 退出码 | 说明 |
|--------|------|
| `0` | 成功提交 |
| `1` | 一般错误 |
| `2` | 非 git 仓库 |
| `3` | 暂存区为空 |
| `4` | 配置缺失或无效 |
| `5` | LLM 调用失败 |
| `10` | 用户取消 |

---

## 3. 配置命令 (Config)

### 用法

```bash
smart-git-commit --config
```

### 交互流程

1. 显示当前配置（如果存在）
2. 逐项询问配置项，提供默认值（当前值或系统默认值）
3. 最后确认保存

### 配置项

| 配置项 | 提示 | 默认值 | 验证 |
|--------|------|--------|------|
| `baseUrl` | "请输入 LLM API 基础地址" | `https://api.openai.com/v1` | 必须以 http:// 或 https:// 开头 |
| `modelName` | "请输入模型名称" | `gpt-3.5-turbo` | 不能为空 |
| `apiKey` | "请输入 API Key" | （空） | 不能为空 |
| `defaultLanguage` | "请选择默认语言" | `en_US` | 从列表选择 |
| `useSemanticCommit` | "是否启用 Semantic Git Commit 规则？" | `true` | 是/否 |

### 输出示例

```
⚙️  Smart Git Commit 配置向导

当前配置文件: ~/.smart-git-commit.json

? 请输入 LLM API 基础地址 (https://api.openai.com/v1) 
? 请输入模型名称 (gpt-3.5-turbo) 
? 请输入 API Key ************************
? 请选择默认语言 (Use arrow keys)
  ❯ 简体中文 (zh_CN)
    繁體中文 (zh_TW)
    English (en_US)
    日本語 (ja_JP)
? 是否启用 Semantic Git Commit 规则？ (Y/n) 

✓ 配置已保存到 ~/.smart-git-commit.json
```

---

## 4. 帮助命令 (Help)

### 用法

```bash
smart-git-commit --help
```

### 输出格式

```
Smart Git Commit - 智能生成 Git Commit Message

使用方法:
  smart-git-commit [options]

选项:
  -s, --silence    静默模式，跳过预览直接提交
  -c, --config     启动交互式配置向导
  -h, --help       显示帮助信息
  -v, --version    显示版本号

示例:
  smart-git-commit          # 生成 commit message 并预览提交
  smart-git-commit -s       # 静默模式，直接提交
  smart-git-commit --config # 配置工具

配置文件: ~/.smart-git-commit.json

项目地址: https://github.com/your-org/smart-git-commit
```

---

## 5. 错误信息格式

所有错误信息遵循以下格式：

```
✗ [错误标题]

[错误描述]

💡 建议：[解决建议]
```

### 错误示例

**非 git 仓库：**
```
✗ 当前目录不是 Git 仓库

请在 Git 仓库中运行此命令。

💡 建议：使用 git init 初始化仓库，或切换到 Git 仓库目录
```

**暂存区为空：**
```
✗ 暂存区为空

暂存区没有任何文件变更。

💡 建议：使用 git add <file> 将文件添加到暂存区后再试
```

**配置缺失：**
```
✗ 未检测到配置文件

首次使用需要配置 LLM API 信息。

💡 建议：运行 smart-git-commit --config 进行配置，或设置 OPENAI_API_KEY 环境变量
```

**LLM 调用失败：**
```
✗ LLM API 调用失败

请求超时，请检查网络连接或 API 地址是否正确。

💡 建议：
  1. 检查网络连接是否正常
  2. 确认 API Key 是否有效
  3. 检查 base_url 配置是否正确
  4. 如果问题持续，尝试更换模型
```

---

## 6. 环境变量支持

| 环境变量 | 说明 | 对应配置项 |
|----------|------|-----------|
| `OPENAI_API_KEY` | API 密钥 | `apiKey` |
| `OPENAI_BASE_URL` | API 基础地址 | `baseUrl` |
| `SMART_GIT_COMMIT_CONFIG` | 配置文件路径 | （配置文件位置） |

环境变量优先级高于配置文件中的设置。
