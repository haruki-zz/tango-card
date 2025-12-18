# Repository Guidelines

# 重要提示 （Always）
# 写任何代码前必须完整阅读
# 写任何代码前必须完整阅读 prompts/@coding_prompts.md(包含必须遵守的编程规范) 
# 写任何代码前必须完整阅读 prompts/@system_prompts.md（包含必须遵守的系统定义和约束）
# 写任何代码前必须完整阅读 memory-bank/@architecture.md（包含完整数据库结构）
# 写任何代码前必须完整阅读 memory-bank/@design-document.md
# 每完成一个重大功能或里程碑后，必须更新 memory-bank/@architecture.md

## Project Structure & Module Organization
- `design-document.md`：产品需求与交互概要。
- `tech-stack.md`：推荐技术栈与选型理由。
- 预期目录：`/electron`（主进程、预加载脚本）、`/renderer`（React+Vite 前端）、`/db`（SQLite schema/迁移）、`/scripts`（构建与打包辅助）。放置测试于相邻的 `__tests__` 或 `*.test.ts(x)`。

## Build, Test, and Development Commands
- 安装依赖：`pnpm install`（推荐）或 `npm install`。
- 开发模式：`pnpm run dev`（并行启动 Electron 主进程与 Vite 渲染进程）。
- Lint：`pnpm run lint`（ESLint/Prettier）。
- 单测：`pnpm test`（Vitest + Testing Library）。
- 打包：`pnpm run build`（Vite 产物）+ `pnpm run dist`（electron-builder 生成安装包）。

## Coding Style & Naming Conventions
- 语言：TypeScript；缩进 2 空格；尽量使用函数式无状态组件。
- 命名：组件 PascalCase，hooks 以 `use` 前缀，IPC 渠道使用 `domain:action`（如 `word:add`）。
- 样式：Tailwind 优先，必要时局部 CSS Modules；保持扁平化设计，避免拟物。
- 提交前运行 `lint` 与 `test`，保持零警告。

## Testing Guidelines
- 框架：Vitest；UI 交互使用 @testing-library/react。
- 覆盖重点：卡片翻转交互、随机复习队列逻辑、Heat Map 数据聚合、AI 调用失败回退。
- 测试命名：文件 `*.test.ts(x)`，用例描述使用场景+期望（英文或简洁中文皆可）。

## Commit & Pull Request Guidelines
- Commit 信息使用祈使句简洁描述（如 `Add review queue store`）。一次提交聚焦单一变更。
- PR 需包含：目的概述、主要改动列表、测试证明（命令或截图）、关联 Issue（如有）。
- 优先小步提交与早期评审，避免大杂烩。

## Security & Configuration Tips
- 启用 Electron `contextIsolation`，仅通过预加载暴露白名单 IPC；渲染层禁止直接使用 Node API。
- API 密钥通过环境变量注入，不写入代码库；本地配置使用 `.env.local`，勿提交。
- SQLite 文件存放用户数据目录；迁移脚本纳入版本控制，避免手工改表。
