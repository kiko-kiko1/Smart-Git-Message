# Implementation Plan: 自动生成 Git Commit Message

**Branch**: `001-auto-commit-message` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-auto-commit-message/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Smart Git Commit 是一个用 TypeScript 开发的 CLI 工具，通过调用 OpenAI 兼容的 LLM API 自动生成符合项目风格的 git commit message。核心流程为：检测 git 环境 → 获取暂存区 diff → 分析历史 commit 风格 → 调用 LLM 生成 message → 用户预览编辑 → 执行提交。采用模块化架构，将 CLI 交互、LLM 调用、Git 操作三层分离，确保高内聚低耦合。

## Technical Context

**Language/Version**: TypeScript 5.x，编译为 JavaScript (Node.js 18+) 运行

**Primary Dependencies**:
- commander - CLI 命令解析
- inquirer - 交互式命令行用户界面
- ora - 终端 loading 指示器
- chalk - 终端颜色输出
- openai - OpenAI API 客户端（或直接用 fetch）

**Storage**: 本地 JSON 配置文件（`~/.smart-git-commit.json`）

**Testing**: Jest 测试框架，配合 ts-jest 进行 TypeScript 测试

**Target Platform**: macOS、Linux、Windows（跨平台 CLI 工具）

**Project Type**: CLI 工具（command-line interface）

**Performance Goals**:
- commit message 生成平均时间 < 10 秒（不含用户编辑时间）
- 首次配置流程 < 30 秒
- 命令启动响应 < 500ms

**Constraints**:
- 仅支持 OpenAI 兼容的 Chat Completion API
- 测试覆盖率必须 > 70%
- 所有代码必须通过 ESLint 检查
- 中文界面和中文代码注释
- diff 内容过大时需智能截断，不超过 LLM token 限制

**Scale/Scope**: 单项目 CLI 工具，面向个人开发者和小型团队，预计代码量约 2000-3000 行 TypeScript

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. CLI-First Principle
- [x] Feature is delivered as a CLI tool, no GUI components
- [x] Does not replace git, only enhances git workflow
- [x] All user interaction happens in the terminal

### II. Chinese Interface Principle
- [x] CLI interface and error messages are in Chinese
- [x] Code comments are written in Chinese

### III. Out-of-Box Principle
- [x] Minimal configuration required to get started
- [x] Sensible defaults for all options
- [x] Clear setup documentation

### IV. Workflow Integration Principle
- [x] Integrates with existing git workflow
- [x] Does not interrupt or break user workflow
- [x] Works as a git add-on, not a replacement

### V. Performance-First Principle
- [x] LLM response time optimized
- [x] Loading states shown during LLM calls
- [x] No unnecessary waiting

### VI. CLI UX Principle
- [x] Loading indicators for async operations
- [x] Constructive error messages with suggestions
- [x] Clear help documentation
- [x] Well-structured --help output

### VII. Modular Architecture Principle
- [x] UI logic separated from LLM logic
- [x] Git info retrieval logic separated
- [x] Modules are single-responsibility
- [x] High cohesion, low coupling

### Technology Stack Gates
- [x] TypeScript with npm package management
- [x] ESLint configured and passing
- [x] OpenAI-compatible Chat Completion API only
- [x] Test coverage > 70%

## Project Structure

### Documentation (this feature)

```text
specs/001-auto-commit-message/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── cli/                 # CLI界面逻辑 - 命令解析、用户交互
│   ├── index.ts         # CLI入口，命令注册
│   ├── commands/        # 各子命令实现
│   │   ├── commit.ts    # 核心提交命令
│   │   ├── config.ts    # 配置命令
│   │   └── help.ts      # 帮助命令
│   └── ui/              # UI组件（loading、颜色输出等）
├── llm/                 # LLM相关逻辑 - API调用、Prompt管理
│   ├── index.ts         # LLM服务入口
│   ├── client.ts        # API客户端
│   ├── prompts/         # Prompt模板
│   │   └── commit.ts    # commit message生成prompt
│   └── style-analyzer.ts # 历史commit风格分析
├── git/                 # Git信息获取 - 暂存区、差异、历史
│   ├── index.ts         # Git服务入口
│   ├── staging.ts       # 暂存区操作
│   ├── diff.ts          # diff获取与处理
│   └── history.ts       # 历史commit获取
├── config/              # 配置管理
│   ├── index.ts         # 配置服务入口
│   ├── loader.ts        # 配置加载
│   ├── saver.ts         # 配置保存
│   └── defaults.ts      # 默认配置
├── utils/               # 工具函数
│   ├── token-counter.ts # token计数与截断
│   └── errors.ts        # 错误处理
└── index.ts             # 工具入口文件

tests/
├── unit/
│   ├── git/
│   ├── llm/
│   ├── config/
│   └── utils/
└── integration/
    └── commit-flow.test.ts
```

**Structure Decision**: 采用 TypeScript CLI 项目结构，严格遵循章程规定的模块化分层。src/ 下分为 cli/、llm/、git/、config/、utils/ 五个模块，各模块职责单一，通过 CLI 层协调。配置文件保存在用户主目录，符合 CLI 工具的惯例。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (no violations - all gates pass) | - | - |
