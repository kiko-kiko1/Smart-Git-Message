# Quickstart: Smart Git Commit 快速上手指南

**Date**: 2026-06-23
**Feature**: 自动生成 Git Commit Message

## 前置条件

- Node.js 18 或更高版本
- Git 已安装并配置
- 有可用的 OpenAI 兼容 API 的 API Key

---

## 场景一：首次使用（配置 + 生成第一个 commit）

### 目标
在 30 秒内完成配置并生成第一个自动生成的 commit message。

### 步骤

**1. 安装工具**

```bash
npm install -g smart-git-commit
```

**2. 在 git 仓库中添加一些文件变更**

```bash
cd your-project
echo "# test" > test.txt
git add test.txt
```

**3. 运行工具（首次会自动进入配置向导）**

```bash
smart-git-commit
```

**4. 按提示完成配置**

依次输入：
- API 基础地址（默认即可）
- 模型名称（默认即可）
- API Key
- 选择默认语言
- 是否启用 Semantic Commit 规则

**5. 预览生成的 commit message 并确认提交**

### 预期结果

- 配置保存到 `~/.smart-git-commit.json`
- 成功生成 commit message
- 文件被提交到 git
- 退出码为 0

### 验证命令

```bash
# 查看最新的 commit
git log -1 --oneline
```

---

## 场景二：日常使用（正常提交流程）

### 目标
快速生成并提交 commit，体验预览编辑功能。

### 步骤

**1. 创建文件变更**

```bash
# 修改一些文件
echo "new feature" >> src/app.ts
git add src/app.ts
```

**2. 运行工具**

```bash
smart-git-commit
```

**3. 观察工具行为**
- 检测到暂存区变更
- 显示 loading 指示器
- 生成 commit message
- 显示预览界面

**4. 选择编辑，修改 message**
- 按 `e` 进入编辑模式
- 修改 message 内容
- 保存并确认提交

### 预期结果

- 生成的 commit message 符合项目风格
- 编辑功能正常工作
- 提交成功，message 为编辑后的内容

### 验证命令

```bash
# 查看最新 commit
git log -1 --format="%B"
```

---

## 场景三：静默模式（高级用户）

### 目标
使用 `--silence` 模式跳过预览，一键提交。

### 前置条件
- 已完成配置
- 对生成质量有信心

### 步骤

```bash
# 添加文件
git add some-file.ts

# 静默模式直接提交
smart-git-commit --silence
```

### 预期结果

- 不显示预览和编辑界面
- 直接生成并提交
- 只显示最终结果
- 整个过程 < 10 秒（网络良好情况下）

### 验证命令

```bash
git log -1 --oneline
```

---

## 场景四：配置管理

### 目标
使用 `--config` 命令修改配置。

### 步骤

```bash
smart-git-commit --config
```

### 预期结果

- 显示当前配置值
- 可以逐项修改
- 确认后保存到配置文件

### 验证命令

```bash
# 查看配置文件内容
cat ~/.smart-git-commit.json
```

---

## 场景五：异常场景测试

### 5.1 非 git 仓库

```bash
cd /tmp
mkdir test-dir && cd test-dir
smart-git-commit
```

**预期**: 显示友好的错误提示，建议初始化 git 仓库

### 5.2 暂存区为空

```bash
cd your-git-repo
smart-git-commit
```

**预期**: 提示暂存区为空，建议先 git add

### 5.3 查看帮助

```bash
smart-git-commit --help
```

**预期**: 显示完整的帮助文档，包括所有选项和示例

---

## 配置参考

配置文件位置：`~/.smart-git-commit.json`

```json
{
  "baseUrl": "https://api.openai.com/v1",
  "modelName": "gpt-3.5-turbo",
  "apiKey": "your-api-key-here",
  "defaultLanguage": "zh_CN",
  "useSemanticCommit": true
}
```

也支持通过环境变量配置（优先级高于配置文件）：

```bash
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

---

## 相关文档

- [CLI 接口契约](./contracts/cli.md) - 完整的命令、参数、输出格式定义
- [数据模型](./data-model.md) - 核心数据结构定义
- [技术选型研究](./research.md) - 技术决策依据
- [功能规格](./spec.md) - 完整的需求规格
