# Feature Specification: 自动生成 Git Commit Message

**Feature Branch**: `001-auto-commit-message`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "做一个工具叫Smart Git Commit，用于每次在代码提交的时候自动生成commit message"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 自动生成并提交 Commit Message (Priority: P1)

开发者在完成代码编写后，运行工具自动分析暂存区变更，生成符合规范的 commit message，预览确认后执行提交。

**Why this priority**: 这是工具的核心价值主张，是用户最主要的使用场景。没有这个功能，工具就没有存在的意义。

**Independent Test**: 可以通过在一个 git 仓库中创建一些文件变更，然后运行工具，验证是否能生成合理的 commit message 并成功提交。

**Acceptance Scenarios**:

1. **Given** 用户在 git 仓库中且暂存区有文件变更，**When** 运行 smart-git-commit 命令，**Then** 工具分析暂存区 diff，调用 LLM 生成 commit message，展示给用户预览并允许编辑，用户确认后执行 git commit。
2. **Given** 用户不在 git 仓库中，**When** 运行 smart-git-commit 命令，**Then** 提示用户当前目录不是 git 仓库，请先初始化 git 仓库。
3. **Given** 用户在 git 仓库中但暂存区为空，**When** 运行 smart-git-commit 命令，**Then** 提示用户暂存区为空，请先使用 git add 添加文件。
4. **Given** LLM 调用失败，**When** 工具尝试生成 commit message，**Then** 显示清晰的错误信息和解决建议（如检查 API Key、网络连接等）。

---

### User Story 2 - 交互式配置管理 (Priority: P2)

用户可以通过交互式 CLI 界面对工具进行配置，包括 LLM 的连接信息和提交风格偏好。首次使用时自动进入配置流程。

**Why this priority**: 配置是使用工具的前提条件，但可以通过环境变量等方式绕过，因此优先级略低于核心功能。良好的配置体验对新手友好。

**Independent Test**: 可以通过运行 `--config` 子命令，验证配置流程是否正常工作，配置是否正确保存到配置文件中。

**Acceptance Scenarios**:

1. **Given** 用户首次使用工具（配置文件不存在），**When** 运行 smart-git-commit 命令，**Then** 自动进入交互式配置流程，引导用户设置 base_url、model_name、api_key、默认语言、是否启用 Semantic Git Commit 规则。
2. **Given** 用户已配置过，**When** 运行 `smart-git-commit --config`，**Then** 进入交互式配置界面，显示当前配置值，允许用户逐项修改。
3. **Given** 用户完成配置，**When** 确认保存，**Then** 配置保存到 `~/.smart-git-commit.json` 文件中。
4. **Given** 用户运行 `smart-git-commit --help`，**Then** 显示工具的使用说明、所有子命令和参数的详细说明。

---

### User Story 3 - 静默模式与风格学习 (Priority: P3)

高级用户可以使用静默模式跳过预览直接提交，工具还能学习项目历史 commit 的风格，使生成的 message 更符合项目习惯。

**Why this priority**: 这些是提升效率的高级功能，不是核心必需，但能显著提升高级用户的使用体验。

**Independent Test**: 可以通过在有历史 commit 的仓库中使用静默模式，验证是否能直接提交且生成的 message 风格与历史一致。

**Acceptance Scenarios**:

1. **Given** 用户已完成配置且暂存区有变更，**When** 运行 `smart-git-commit --silence`，**Then** 跳过预览和编辑步骤，直接生成 commit message 并执行提交。
2. **Given** 项目有较多历史 commit，**When** 工具生成 commit message，**Then** 会参考历史 commit 的风格（如是否使用 Conventional Commits、语言习惯、前缀格式等），使生成的 message 与项目风格保持一致。
3. **Given** 项目历史 commit 很少或没有，**When** 工具生成 commit message，**Then** 基于默认配置和 Semantic Git Commit 规范生成合理的 message。
4. **Given** 暂存区的 diff 特别大，**When** 工具生成 commit message，**Then** 能够智能截断或摘要 diff 内容，确保不超过 LLM 的 token 限制，同时保持生成质量。

---

### Edge Cases

- 如果 diff 内容过大导致 token 超限怎么办？工具需要智能截断或摘要，优先保留关键信息。
- 如果配置文件损坏或格式错误怎么办？工具应该给出明确错误提示并允许重新配置。
- 如果 git 仓库有冲突未解决怎么办？应该提示用户先解决冲突。
- 如果用户在编辑 commit message 时输入为空怎么办？应该提示不能为空或使用生成的默认值。
- 如果网络超时导致 LLM 调用失败怎么办？应该有重试机制或友好的错误提示。
- 如果用户配置了 git hooks（pre-commit、commit-msg 等）怎么办？工具直接调用 `git commit` 命令，git hooks 会正常触发，不做特殊处理。
- 如果用户有 git commit 的别名（如 `git ci`）怎么办？不影响，本工具是独立的 CLI 命令，内部直接调用 `git commit` 原生命令。
- 如果用户想把本工具设置为 git 别名怎么办？用户可以自行配置（如 `git config --global alias.sgc '!smart-git-commit'`），工具本身不需要特殊支持。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 检测当前目录是否为 git 仓库，如不是则提示用户初始化。
- **FR-002**: 系统 MUST 检测 git 暂存区是否为空，如为空则提示用户先 add 文件。
- **FR-003**: 系统 MUST 获取暂存区的文件 diff 内容。
- **FR-004**: 系统 MUST 获取项目的历史 commit 记录用于风格学习。
- **FR-005**: 系统 MUST 调用 LLM 生成符合 Semantic Git Commit 规范的 commit message。
- **FR-006**: 系统 MUST 将生成的 commit message 展示给用户预览。
- **FR-007**: 系统 MUST 允许用户编辑生成的 commit message。
- **FR-008**: 系统 MUST 在用户确认后执行 git commit 操作。
- **FR-009**: 系统 MUST 支持 `--help` 子命令，显示完整的使用说明和帮助文档。
- **FR-010**: 系统 MUST 支持 `--config` 子命令，通过交互式 CLI 进行配置。
- **FR-011**: 系统 MUST 支持 `--silence` 子命令，跳过预览直接提交。
- **FR-012**: 系统 MUST 将配置保存在 `~/.smart-git-commit.json` 文件中。
- **FR-013**: 系统配置 MUST 包含：base_url、model_name、api_key、默认语言、是否启用 Semantic Git Commit 规则。
- **FR-014**: 系统 MUST 在 LLM 调用过程中显示 loading 指示器。
- **FR-015**: 系统 MUST 在 LLM 调用失败时显示清晰的错误信息和解决建议。
- **FR-016**: 系统 MUST 支持所有兼容 OpenAI Chat Completion API 的 LLM 服务商。
- **FR-017**: 系统 MUST 能处理大 diff 的情况，确保不超过 LLM token 限制。
- **FR-018**: 系统 MUST 在首次使用（无配置文件）时自动启动配置流程。
- **FR-019**: 生成的 commit message SHOULD 参考项目历史 commit 的语言风格和格式习惯。

### Key Entities

- **配置（Configuration）**: 用户的 LLM 连接信息和偏好设置，存储在 `~/.smart-git-commit.json`。属性包括：base_url、model_name、api_key、default_language、use_semantic_commit。
- **暂存区变更（Staged Changes）**: git 暂存区中的文件差异，包含文件名、变更类型（新增/修改/删除）、具体的 diff 内容。
- **历史提交记录（Commit History）**: 项目的历史 commit 列表，用于学习项目的 commit 风格和语言习惯。
- **生成结果（Generated Message）**: LLM 生成的 commit message，包含标题和可选的正文描述。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以在 30 秒内完成首次配置并生成第一个 commit message。
- **SC-002**: 90% 的情况下，生成的 commit message 无需修改或只需少量修改即可直接提交。
- **SC-003**: 从命令执行到 commit message 生成完成的平均时间不超过 10 秒（不包含用户编辑时间）。
- **SC-004**: 用户在暂存区有变更的情况下，从运行命令到完成提交的完整流程不超过 1 分钟。
- **SC-005**: 生成的 commit message 与项目历史风格的一致率达到 80% 以上（在有足够历史记录的情况下）。
- **SC-006**: 工具在各种异常场景下（非 git 目录、空暂存区、LLM 失败等）都能给出清晰的中文提示。

## Assumptions

- 用户已安装 git 并配置了基本的 git 环境。
- 用户有可用的 OpenAI 兼容 API 的访问凭证（API Key）。
- 用户的开发环境可以访问外部网络（或用户配置的 LLM 服务地址）。
- 用户熟悉基本的 git 操作（add、commit 等）。
- 项目的 commit 历史可以通过 git log 命令正常获取。
- LLM 服务的响应时间在合理范围内（几秒到十几秒）。
- 配置文件 `~/.smart-git-commit.json` 的读写权限正常。
