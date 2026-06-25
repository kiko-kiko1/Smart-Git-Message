# Data Model: Smart Git Commit 数据模型

**Date**: 2026-06-23
**Feature**: 自动生成 Git Commit Message

## 概述

本项目的数据模型主要围绕配置、Git 信息、LLM 交互三个核心领域展开。所有数据均为内存中的临时状态或本地文件持久化，不涉及数据库。

---

## 1. 配置模型 (Configuration)

### 1.1 AppConfig

用户的全局配置，保存在 `~/.smart-git-commit.json` 文件中。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `baseUrl` | `string` | 是 | `"https://api.openai.com/v1"` | LLM API 的基础地址 |
| `modelName` | `string` | 是 | `"gpt-3.5-turbo"` | 使用的模型名称 |
| `apiKey` | `string` | 是 | `""` | API 密钥 |
| `defaultLanguage` | `string` | 是 | `"en_US"` | commit message 的默认语言 |
| `useSemanticCommit` | `boolean` | 是 | `true` | 是否启用 Semantic Git Commit 规则 |

**验证规则**：
- `baseUrl`: 必须是有效的 URL，以 `http://` 或 `https://` 开头
- `modelName`: 不能为空字符串
- `apiKey`: 不能为空字符串
- `defaultLanguage`: 必须是有效的语言代码（如 `en_US`、`zh_CN` 等）
- `useSemanticCommit`: 布尔值

**JSON 示例**：
```json
{
  "baseUrl": "https://api.openai.com/v1",
  "modelName": "gpt-3.5-turbo",
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "defaultLanguage": "zh_CN",
  "useSemanticCommit": true
}
```

---

## 2. Git 信息模型

### 2.1 StagedFile

暂存区中的单个文件变更。

| 字段 | 类型 | 说明 |
|------|------|------|
| `filename` | `string` | 文件路径（相对仓库根目录） |
| `status` | `'added' \| 'modified' \| 'deleted' \| 'renamed'` | 文件变更状态 |
| `additions` | `number` | 新增行数 |
| `deletions` | `number` | 删除行数 |
| `diff` | `string` | 文件的完整 diff 内容 |

### 2.2 StagedChanges

暂存区的所有变更集合。

| 字段 | 类型 | 说明 |
|------|------|------|
| `files` | `StagedFile[]` | 变更文件列表 |
| `totalFiles` | `number` | 变更文件总数 |
| `totalAdditions` | `number` | 总新增行数 |
| `totalDeletions` | `number` | 总删除行数 |
| `rawDiff` | `string` | 完整的 diff 输出 |

### 2.3 CommitRecord

单条历史 commit 记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| `hash` | `string` | commit hash（短格式） |
| `subject` | `string` | commit 标题（第一行） |
| `body` | `string` | commit 正文（可为空） |
| `author` | `string` | 作者名称 |
| `date` | `string` | 提交日期（ISO 格式） |

### 2.4 CommitHistory

项目的 commit 历史集合。

| 字段 | 类型 | 说明 |
|------|------|------|
| `commits` | `CommitRecord[]` | commit 列表（按时间倒序） |
| `totalCount` | `number` | 总 commit 数 |
| `style` | `CommitStyle` | 分析得出的 commit 风格 |

### 2.5 CommitStyle

从历史 commit 中分析得出的风格特征。

| 字段 | 类型 | 说明 |
|------|------|------|
| `usesConventionalCommits` | `boolean` | 是否使用 Conventional Commits 格式 |
| `commonTypes` | `string[]` | 常用的 type 列表（如 feat、fix、docs 等） |
| `language` | `string` | commit message 的主要语言 |
| `hasScope` | `boolean` | 是否常使用 scope（如 feat(scope): ...） |
| `hasBody` | `boolean` | 是否常包含正文 |
| `subjectLength` | `{ avg: number; max: number }` | 标题长度统计 |

---

## 3. LLM 交互模型

### 3.1 GenerateCommitMessageRequest

发送给 LLM 的生成请求。

| 字段 | 类型 | 说明 |
|------|------|------|
| `diff` | `string` | 暂存区的 diff 内容（可能已截断） |
| `commitHistory` | `string` | 历史 commit 摘要（用于风格学习） |
| `style` | `CommitStyle` | 分析出的 commit 风格 |
| `language` | `string` | 期望的输出语言 |
| `useSemantic` | `boolean` | 是否使用 Semantic Commit 规则 |

### 3.2 GeneratedCommitMessage

LLM 生成的 commit message 结果。

| 字段 | 类型 | 说明 |
|------|------|------|
| `subject` | `string` | commit 标题（必填） |
| `body` | `string` | commit 正文（可选） |
| `type` | `string` | commit 类型（如 feat、fix 等，Semantic Commit 时存在） |
| `scope` | `string` | 影响范围（可选） |

---

## 4. 工具执行状态模型

### 4.1 ExecutionContext

工具执行时的上下文状态，在各个模块间传递。

| 字段 | 类型 | 说明 |
|------|------|------|
| `cwd` | `string` | 当前工作目录 |
| `config` | `AppConfig` | 加载后的配置 |
| `silent` | `boolean` | 是否为静默模式 |
| `stagedChanges` | `StagedChanges \| null` | 暂存区变更（按需加载） |
| `commitHistory` | `CommitHistory \| null` | 历史 commit（按需加载） |
| `generatedMessage` | `GeneratedCommitMessage \| null` | 生成的 message（LLM 调用后） |

---

## 5. 错误模型

### 5.1 AppError

应用错误类型，包含友好的错误信息和解决建议。

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `string` | 错误代码（如 GIT_NOT_REPO、STAGING_EMPTY、LLM_ERROR 等） |
| `message` | `string` | 用户可读的错误信息（中文） |
| `suggestion` | `string` | 解决建议（中文） |
| `details` | `string` | 技术细节（可选，用于调试） |

**预定义错误代码**：
- `GIT_NOT_REPO`: 当前目录不是 git 仓库
- `GIT_STAGING_EMPTY`: 暂存区为空
- `GIT_CONFLICT`: 存在未解决的冲突
- `CONFIG_NOT_FOUND`: 配置文件不存在
- `CONFIG_INVALID`: 配置文件格式错误
- `LLM_API_ERROR`: LLM API 调用失败
- `LLM_TOKEN_LIMIT`: 超过 token 限制
- `LLM_TIMEOUT`: 请求超时
- `COMMIT_EMPTY_MESSAGE`: commit message 为空
