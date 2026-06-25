# Research: Smart Git Commit 技术选型研究

**Date**: 2026-06-23
**Feature**: 自动生成 Git Commit Message

## 1. CLI 框架选型

### Decision: 使用 commander.js

**Rationale**:
- commander 是 Node.js 生态中最成熟、使用最广泛的 CLI 框架
- 开箱即用的参数解析、帮助文档生成、子命令支持
- 与 TypeScript 集成良好，类型定义完善
- 轻量级，启动速度快，符合性能优先原则
- API 简洁直观，学习成本低

**Alternatives considered**:
- **yargs**: 功能更强大但更重，启动速度稍慢，对于本项目来说功能过剩
- **oclif**: Heroku 出品的企业级 CLI 框架，功能全面但过于重量级，适合大型 CLI 项目
- **原生 process.argv**: 零依赖但需要自己处理很多边界情况，开发效率低

---

## 2. 交互式 CLI 组件选型

### Decision: 使用 inquirer + ora + chalk 组合

**Rationale**:
- **inquirer**: 交互式命令行的事实标准，支持多种输入类型（input、confirm、list、editor 等），可以满足配置向导和 commit message 编辑的需求
- **ora**: 轻量级 loading 指示器，样式丰富，动画流畅
- **chalk**: 终端颜色输出的标准库，API 简洁，支持色阶
- 三者配合使用可以提供优秀的 CLI 用户体验，符合章程中的 CLI UX 原则

**Alternatives considered**:
- **prompts**: 比 inquirer 更轻量，但生态和社区活跃度稍逊
- **enquirer**: 现代化设计，但使用人数较少，遇到问题时解决方案少
- **clack**: 较新的库，UI 漂亮但生态不成熟

---

## 3. LLM API 客户端选型

### Decision: 使用原生 fetch（Node.js 18+ 内置）

**Rationale**:
- Node.js 18+ 内置 fetch，无需额外依赖
- OpenAI 兼容 API 格式简单，使用 fetch 足够
- 减少依赖数量，加快启动速度，减小包体积
- 更灵活，可以精确控制请求和响应处理
- 避免 openai 官方 SDK 带来的额外依赖和体积

**Alternatives considered**:
- **openai (官方 SDK)**: 类型定义完善，但依赖较多，包体积大，启动较慢
- **axios**: 通用 HTTP 客户端，功能全面但对本项目来说功能过剩
- **undici**: Node.js 官方的高性能 HTTP 客户端，性能更好但 API 较底层

---

## 4. 测试框架选型

### Decision: 使用 Jest + ts-jest

**Rationale**:
- Jest 是 TypeScript/JavaScript 生态最流行的测试框架
- 内置断言、Mock、覆盖率报告，一站式解决方案
- ts-jest 提供 TypeScript 支持，配置简单
- 测试运行速度快，支持 watch 模式
- 社区资源丰富，问题容易找到解决方案

**Alternatives considered**:
- **Vitest**: 速度更快，Vite 生态，但本项目不使用 Vite
- **Mocha + Chai**: 更灵活但需要组合多个库，配置复杂
- **ava**: 并发测试，速度快，但生态较小

---

## 5. Git 操作方式选型

### Decision: 使用 child_process 调用 git 命令

**Rationale**:
- 直接调用 git 命令最可靠，与用户环境完全一致
- 避免依赖 git 相关的 Node.js 库（如 simple-git、isomorphic-git）
- 减少依赖，降低包体积，加快启动速度
- git 命令的输出格式稳定，解析成熟
- 用户已安装 git（假设条件），无需额外安装

**Alternatives considered**:
- **simple-git**: 封装良好的 git 库，但增加依赖且启动慢
- **isomorphic-git**: 纯 JS 实现的 git，不依赖系统 git，但包体积大，功能有限
- **nodegit**: libgit2 的 Node.js 绑定，性能好但需要编译，跨平台兼容性问题多

---

## 6. 配置文件管理选型

### Decision: 手动读写 JSON + 环境变量支持

**Rationale**:
- 配置结构简单（5个字段），手动读写足够
- JSON 格式直观，用户容易理解和手动编辑
- 支持从环境变量读取（如 OPENAI_API_KEY），符合开箱即用原则
- 不引入额外的配置管理库，保持轻量
- 配置文件路径 `~/.smart-git-commit.json` 符合 Unix CLI 工具惯例

**Alternatives considered**:
- **cosmiconfig**: 支持多种配置格式，自动查找，但对本项目来说过于复杂
- **rc**: 经典的配置文件库，但功能较老
- **dotenv**: .env 文件支持，适合项目级配置，不适合全局 CLI 工具

---

## 7. Token 计数与截断选型

### Decision: 使用 tiktoken 库 + 启发式截断策略

**Rationale**:
- tiktoken 是 OpenAI 官方的 tokenizer，计数准确
- 对于大 diff，采用启发式截断：保留文件列表 + 每个文件的前 N 行变更
- 优先保留变更的摘要信息，而非完整 diff
- 确保不超过 LLM 的 token 限制，同时保持生成质量

**Alternatives considered**:
- **gpt-tokenizer**: 纯 JS 实现，无需 wasm，但准确性稍差
- **简单字符估算**: 按字符数估算（约 4 字符 = 1 token），速度快但不准确
- **按文件数截断**: 只取前 N 个文件的 diff，实现简单但可能丢失重要信息

---

## 8. 代码规范工具选型

### Decision: 使用 ESLint + Prettier

**Rationale**:
- 章程明确要求 ESLint 代码检查
- Prettier 负责代码格式化，ESLint 负责代码质量
- 两者配合使用，覆盖代码规范的所有方面
- 生态成熟，TypeScript 支持完善
- 社区有大量最佳实践和配置预设

**Alternatives considered**:
- **Biome (Rome)**: 速度快，Rust 实现，但生态较新，规则覆盖度不如 ESLint
- **StandardJS**: 零配置，但规则固定，灵活性差
