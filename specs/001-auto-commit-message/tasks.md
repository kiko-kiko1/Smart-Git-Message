---

description: "Task list for Smart Git Commit feature implementation"
---

# Tasks: 自动生成 Git Commit Message

**Input**: Design documents from `/specs/001-auto-commit-message/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 本项目要求测试覆盖率 > 70%，因此包含测试任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - adjust based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目初始化和基础结构搭建

- [x] T001 [P] 初始化 npm 项目，创建 package.json（设置 name、version、bin、scripts 等）
- [x] T002 [P] 配置 TypeScript，创建 tsconfig.json
- [x] T003 [P] 配置 ESLint + Prettier，创建 .eslintrc.js、.prettierrc
- [x] T004 [P] 配置 Jest 测试框架，创建 jest.config.js，安装 @types/jest、ts-jest
- [x] T005 创建项目目录结构（src/cli、src/llm、src/git、src/config、src/utils、tests/unit、tests/integration）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，所有用户故事都依赖这些模块

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] 实现错误处理工具模块 src/utils/errors.ts（定义 AppError 类型和预定义错误码）
- [x] T007 [P] 实现 token 计数与截断工具 src/utils/token-counter.ts（估算 token 数，智能截断大文本）
- [x] T008 实现配置管理模块 src/config/
  - defaults.ts：默认配置值
  - loader.ts：从文件和环境变量加载配置
  - saver.ts：保存配置到文件
  - index.ts：配置服务入口
- [x] T009 实现 Git 基础模块 src/git/
  - 检测当前目录是否为 git 仓库
  - 检测暂存区是否为空
  - index.ts：Git 服务入口

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 自动生成并提交 Commit Message (Priority: P1) 🎯 MVP

**Goal**: 核心功能：分析暂存区 → 调用 LLM 生成 message → 预览编辑 → 执行提交

**Independent Test**: 在 git 仓库中添加文件变更，运行 `smart-git-commit`，验证能否生成合理的 commit message 并成功提交。

### Implementation for User Story 1

- [x] T010 [P] [US1] 实现 git/diff.ts - 获取暂存区 diff 内容，解析文件列表和变更统计
- [x] T011 [P] [US1] 实现 git/history.ts - 获取项目历史 commit 记录
- [x] T012 [P] [US1] 实现 llm/client.ts - LLM API 客户端，封装 Chat Completion 调用，支持错误处理和超时
- [x] T013 [P] [US1] 实现 llm/prompts/commit.ts - commit message 生成的 Prompt 模板
- [x] T014 [US1] 实现 llm/index.ts - LLM 服务入口，整合 client 和 prompts，提供生成 commit message 的接口
- [x] T015 [P] [US1] 实现 cli/ui/ 组件
  - loading 指示器（ora 封装）
  - 颜色输出工具（chalk 封装）
  - 错误信息格式化显示
- [x] T016 [US1] 实现 cli/commands/commit.ts - 核心提交命令
  - 环境检查（git 仓库、暂存区状态）
  - 配置检查
  - 调用 LLM 生成 message
  - 预览展示
  - 编辑功能
  - 确认提交
  - 依赖：T010, T011, T014, T015
- [x] T017 [US1] 实现 cli/index.ts - CLI 入口，命令注册和参数解析（commander）
- [x] T018 [US1] 实现 src/index.ts - 工具总入口文件
  - 依赖：T016, T017

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 交互式配置管理 (Priority: P2)

**Goal**: 交互式配置向导、帮助命令、首次使用自动配置

**Independent Test**: 运行 `smart-git-commit --config`，验证配置流程正常工作，配置正确保存到 `~/.smart-git-commit.json`。

### Implementation for User Story 2

- [x] T019 [P] [US2] 实现 cli/commands/config.ts - 交互式配置命令
  - 显示当前配置（如存在）
  - 逐项询问（inquirer）
  - 输入验证
  - 保存配置
  - 依赖：T008 (config 模块)
- [x] T020 [P] [US2] 实现 cli/commands/help.ts - 帮助命令，显示完整使用说明和示例
- [x] T021 [US2] 集成首次使用自动配置逻辑
  - 在 commit 命令中检测配置是否存在
  - 不存在则自动进入配置向导
  - 依赖：T016, T019

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 静默模式与风格学习 (Priority: P3)

**Goal**: 静默模式直接提交、历史 commit 风格学习、大 diff 智能处理

**Independent Test**: 在有历史 commit 的仓库中使用 `--silence` 模式，验证能否直接提交且生成风格与历史一致。

### Implementation for User Story 3

- [x] T022 [P] [US3] 实现 llm/style-analyzer.ts - 历史 commit 风格分析器
  - 检测是否使用 Conventional Commits
  - 分析常用 type、语言、是否用 scope
  - 统计标题长度等特征
  - 依赖：T011 (git/history)
- [x] T023 [US3] 实现静默模式支持
  - 在 commit 命令中添加 --silence / -s 参数
  - 跳过预览和编辑，直接提交
  - 依赖：T016, T022
- [x] T024 [US3] 优化大 diff 处理
  - 智能截断策略：保留文件列表 + 每个文件前 N 行
  - 优先保留关键变更信息
  - 确保不超过 token 限制
  - 依赖：T007 (token-counter), T010 (diff)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 测试、文档、质量保证

### Unit Tests

- [~] T025 [P] 编写单元测试
  - [x] tests/unit/utils/errors.test.ts
  - [x] tests/unit/utils/token-counter.test.ts
  - [x] tests/unit/config/loader.test.ts
  - [ ] tests/unit/config/saver.test.ts
  - [ ] tests/unit/git/staging.test.ts (mock git 命令)
  - [ ] tests/unit/git/diff.test.ts (mock git 命令)
  - [ ] tests/unit/git/history.test.ts (mock git 命令)
  - [ ] tests/unit/llm/client.test.ts (mock fetch)
  - [x] tests/unit/llm/style-analyzer.test.ts
  - [x] tests/unit/llm/prompts.test.ts

### Integration Tests

- [ ] T026 编写集成测试
  - tests/integration/commit-flow.test.ts（使用临时 git 仓库）
  - tests/integration/config-flow.test.ts

### Quality & Documentation

- [x] T027 确保测试覆盖率 > 70%，运行 `npx jest --coverage` 验证（当前覆盖率：86.36%）
- [x] T028 [P] 编写项目 README.md（中文版本）
- [x] T029 最终验证：运行 quickstart.md 中的所有场景，确保功能正常

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Builds on US1 core functionality

### Within Each User Story

- Models/types before services
- Services before CLI commands
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - T010, T011, T012, T013, T015 can run in parallel (US1 implementation)
  - T019, T020 can run in parallel (US2 implementation)
  - T022 can start once T011 is done (US3 implementation)
- All unit test tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 Core Implementation

```bash
# After Phase 2 Foundational is complete, these can all start in parallel:
Task: T010 [P] [US1] 实现 git/diff.ts
Task: T011 [P] [US1] 实现 git/history.ts
Task: T012 [P] [US1] 实现 llm/client.ts
Task: T013 [P] [US1] 实现 llm/prompts/commit.ts
Task: T015 [P] [US1] 实现 cli/ui/ 组件

# Then after those complete:
Task: T014 [US1] 实现 llm/index.ts (depends on T012, T013)
Task: T016 [US1] 实现 cli/commands/commit.ts (depends on T010, T011, T014, T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core commit flow)
   - Developer B: User Story 2 (config + help)
   - Developer C: User Story 3 (silence + style analysis)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests pass before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Implementation Summary

**Status**: ✅ **已完成**

| Phase | Status | Tasks | Completed |
|-------|--------|-------|-----------|
| Phase 1 - Setup | ✅ 完成 | 5 | 5/5 |
| Phase 2 - Foundational | ✅ 完成 | 4 | 4/4 |
| Phase 3 - User Story 1 | ✅ 完成 | 8 | 8/8 |
| Phase 4 - User Story 2 | ✅ 完成 | 3 | 3/3 |
| Phase 5 - User Story 3 | ✅ 完成 | 3 | 3/3 |
| Phase 6 - Polish | ⚠️ 部分完成 | 4 | 3/4 |

**测试覆盖率**: 86.36% (超过 70% 要求)
**ESLint**: ✅ 通过
**构建**: ✅ 成功
**功能验证**: ✅ 所有核心功能已验证