# WorkHub - 个人工作任务/项目/文件一体式管理工具

## 简介

WorkHub 是一款面向**个人工作**的一体式管理桌面应用，将任务、产品、项目、文件整合在统一平台：

- **任务管理**：待办任务创建、优先级分类、截止日期提醒，完成自动记录
- **产品管理**：产品生命周期管理，起止年份、工时代码、项目关联
- **项目管理**：省份年份分类、文件组织、专注模式深入查看
- **文件管理**：文件夹结构、历史打开记录、快速访问、拖拽引用
- **文件编辑**：txt 文件内嵌编辑器，即时保存
- **工作记录**：富文本编辑、文件标签、日期分组展示
- **工作复盘**：周报自动生成、AI 工时估算看板

## 核心定位

**一个人，多个产品/项目，统一管理**

解决个人多项目并行时的常见问题：

- 产品项目信息分散，查找耗时
- 工作记录零散，汇总困难
- 待办与项目脱节，完成无同步
- 文件散落各处，历史难追溯

## 如何使用

直接双击根目录下的 **`WorkHub.exe`** 即可启动应用，无需安装、无需任何环境依赖。

> 适用于 Windows 系统，首次启动可能需要几秒钟加载时间。

## 作品边界与不包含内容

本产品定位为**个人单机工具**，不包含以下功能：多用户账号系统、权限鉴权、云端同步与存储、团队协作、移动端适配、实际文件系统读写（模拟模式下仅演示匹配逻辑）。当前版本聚焦核心流程体验，文件整理功能为模拟演示，不执行真实文件移动操作。工作记录与 AI 工时估算基于本地示例数据，不调用外部 API。

### 1. 启动应用

双击 `work-hub.exe` 或运行 `npm run dev`，进入主界面。

### 2. 查看产品-项目结构

- 左侧面板默认展示产品「AI智能应用构建平台」及其关联项目
- 点击产品/项目左侧箭头展开，查看文件夹结构（汇报材料、申报材料、技术文档等）
- 点击项目名称进入**专注模式**，右侧显示该项目的工作记录

### 3. 体验待办关联

- 点击左侧「待办」Tab，查看今日/逾期/未来待办
- 点击「新建任务」，填写内容并选择「关联项目」
- 完成待办后勾选，自动生成一条工作记录到关联项目

### 4. 文件操作

- 在左侧文件夹中点击任意 txt 文件，直接进入编辑器
- 编辑后点击保存，文件出现在「历史打开的文件」列表
- 点击非 txt 文件（如 pdf、doc），使用系统默认程序打开

### 5. 工作复盘与 AI 工时

- 点击右上角「复盘」图标进入工作复盘页面
- 选择日期范围，查看工作记录按日期分组展示
- 点击「AI 生成工时」，查看工时估算看板
- 点击某日单元格，可查看当日记录详情和推荐补充项

### 6. 文件整理功能

- 点击左侧产品区块工具栏的「整理」按钮
- 选择待整理目录（模拟模式会生成示例文件）
- 点击「智能分析匹配」，查看 AI 推荐的归档位置
- 点击「模拟运行」，生成整理计划（不实际移动文件）

---

## 数据说明

当前版本包含示例数据：

- 预置的产品（AI智能应用构建平台）
- 多个示例项目（业扩、计量、客服等电力营销项目）
- 示例待办任务和工作记录

用户数据保存方式：

- 配置文件：自动保存到本地（产品/项目/待办列表）
- 历史文件：localStorage 存储（最近打开记录）
- txt 文件：真实文件读写，保存到指定目录

## 技术栈

Tauri + React + TypeScript，跨平台桌面应用（Windows / macOS / Linux）

---

## WorkHub Bridge CLI：接入 Claude Code 协作

WorkHub 自带一个**零依赖**的本地命令行工具 `workhub-cli`，让 Claude Code（或任何脚本/自动化流程）
能够读取 WorkHub 的项目/任务/工作记录，并在**用户明确确认**后，将工作记录与后续待办写回
WorkHub 的同一份数据文件——实现 AI 编程助手与个人工作管理工具的数据闭环。

- **零依赖**：纯 Node.js 内置模块实现，无需 `npm install`，Node.js ≥ 18 即可运行。
- **同源读写**：CLI 与桌面应用读写同一份 `records.json` / `todos.json`，写入后 UI 立即可见。
- **安全边界**：所有写入必须先生成变更计划并展示预览，**只有用户明确确认后才提交**。
- **不破坏现有应用**：只追加数据，不迁移格式、不删原数据、不改配置。

### 快速开始

在仓库根目录直接运行（无需安装依赖）：

```bash
# 查看帮助
node workhub-cli/bin/workhub.js --help

# 列出所有项目/产品
node workhub-cli/bin/workhub.js project list --json

# 查看某项目完整上下文（最近记录 + 未完成待办）
node workhub-cli/bin/workhub.js project context p1234567890 --json

# 查看待办 / 工作记录
node workhub-cli/bin/workhub.js task list --status open --json
node workhub-cli/bin/workhub.js record list --project p1234567890 --limit 5 --json
```

> 也可全局安装后用 `workhub` 命令：`cd workhub-cli && npm link`

### 命令一览

**只读命令（安全，随时可用）**

| 命令  | 说明  |
| --- | --- |
| `project list [--json] [--all]` | 列出所有产品/项目目标 |
| `project context <id> [--json]` | 目标上下文：信息 + 最近记录 + 未完成待办 |
| `task list [--project <id>] [--status open\\|done\\|all] [--json]` | 待办列表，支持过滤排序 |
| `record list --project <id> [--limit n] [--json]` | 工作记录，按日期倒序 |

**写入命令（计划门控——仅 `commit` 需要用户确认）**

| 命令  | 说明  |
| --- | --- |
| `plan create --input <plan-file> [--json]` | 校验并创建 pending 计划 + 预览（不写业务数据） |
| `plan show <planId> [--json]` | 重新校验并展示预览（不写业务数据） |
| `plan commit <planId> [--json]` | **执行写入——仅当用户明确确认后** |
| `plan cancel <planId>` | 取消 pending 计划 |
| `plan list [--json]` | 列出所有计划及状态 |

### 写入流程（预览 → 确认 → 提交）

这是核心安全边界，分三步：

**1. 准备计划文件** `my-plan.json`：

```json
{
  "targetId": "p1234567890",
  "operations": [
    { "type": "addRecord", "data": { "content": "<div>完成某功能开发。</div>", "date": "2026-09-17", "time": "15:00", "files": [] } },
    { "type": "addTodo", "data": { "text": "补充测试覆盖", "dueDate": "2026-09-22", "priority": "medium" } }
  ]
}
```

**2. 创建计划 + 看预览**（不写业务数据）：

```bash
node workhub-cli/bin/workhub.js plan create --input my-plan.json --json
node workhub-cli/bin/workhub.js plan show <planId> --json
```

**3. 确认无误后提交**（这一步才真正写入）：

```bash
node workhub-cli/bin/workhub.js plan commit <planId> --json
```

提交后打开 WorkHub 桌面应用进入对应项目，即可看到新写入的工作记录与待办。

### 安全特性

- **人工确认**：`plan create` / `plan show` 只写/读计划文件，不碰业务数据；`plan commit` 是唯一写入步骤，必须经用户明确确认。Claude 自行判断"任务完成"、生成计划、展示预览、用户说"继续"等**均不视为确认**。
- **幂等**：重复提交同一计划不会产生重复记录。
- **版本冲突检测**：若 UI 在预览后保存过数据，`commit` 会被阻断并提示重新创建计划，防止覆盖并发修改。
- **原子写入**：备份 → 临时文件 → rename，失败自动回滚，绝不出现半写文件。
- **路径越权防护**：写入路径必须落在目标目录内，禁止 `..` 遍历。

### 接入 Claude Code

仓库已内置 Claude Code Skill：`.claude/skills/workhub/SKILL.md`。在 Claude Code 中直接对话即可触发，例如：

- **开始工作前**：「帮我看看示例项目这个项目最近在做什么、有哪些待办」
  → Claude 调用 `project context` 读取上下文并总结。
- **完成工作后**：「把刚才做的工作记录到 WorkHub」
  → Claude 起草工作记录 + 后续待办，生成变更计划并展示预览，**等你明确同意后**才会 `plan commit` 写入。
- **恢复上下文**：「我上次在示例产品做到哪了」
  → Claude 读取历史记录与待办，并与代码改动交叉验证。

Skill 内置安全规则：**任何写入都必须先预览、经用户在当前对话中明确确认后才提交**，Claude 不会自动写入你的工作数据。

### 相关文档

- [CLI 使用文档](docs/workhub-bridge-cli.md) — 完整命令参考与示例
- [架构文档](docs/workhub-bridge-architecture.md) — 数据流、安全边界、模块职责
- [审计报告](docs/workhub-bridge-audit.md) — 现有代码与数据存储审计
- [测试报告](docs/workhub-bridge-test-report.md) — 功能与端到端测试结果
- [演示文档](docs/workhub-bridge-demo.md) — 2-3 分钟演示脚本

### 运行测试

```bash
# 功能测试（46 项断言，只读 + 计划流程，不实际提交业务数据）
node workhub-cli/test/run-all.js

# 端到端测试（真实写入一条记录+待办，验证回读与幂等）
node workhub-cli/test/e2e.js
```

---

Vibe Coding with Claude Code
