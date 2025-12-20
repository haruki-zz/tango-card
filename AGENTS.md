# Repository Guidelines

## 重要提示（请务必遵循）
- 做任何设计或者写任何代码前必须完整阅读 `prompts/@system_prompts.md`。
- 写任何代码前必须完整阅读 `prompts/@coding_prompts.md`（包含必须遵守的编程规范）。
- 写任何代码前必须完整阅读 `memory-bank/@architecture.md`（包含完整数据库结构）。
- 写任何代码前必须完整阅读 `memory-bank/@design-document.md`。
- 每完成一个重大功能或里程碑后，必须更新 `memory-bank/@architecture.md`。
- 强调模块化（多文件，各文件职责分明），禁止单体巨文件（monolith）。

## 项目结构与模块
- 根目录：`design-document.md`、`tech-stack.md` 作为设计与栈参考；`prompts/` 存放提示词文档；`memory-bank/` 预留数据/缓存目录。
- 代码组织（落地时）：`src/` 放置应用源代码（主进程、渲染进程、UI 组件）；`tests/` 放单元与集成测试；`e2e/`（可选）放端到端脚本；`assets/` 放静态资源。

## 构建、测试与开发命令
- `npm run dev`：开发模式（Electron + Vite）。
- `npm run build`：打包产物（Electron Builder）。
- `npm run test`：运行 Vitest 单元/集成测试。
- `npm run lint` / `npm run format`：ESLint/Prettier 代码检查与格式化。
- `npm run e2e`（如配置）：运行 Playwright 端到端测试。

## 代码风格与命名
- 语言：TypeScript + React；样式优先 Tailwind。
- 缩进 2 空格，使用 ESLint（推荐标准/TypeScript/React 规则）+ Prettier 自动格式化。
- 命名：组件用 `PascalCase`，工具/函数用 `camelCase`，常量用 `SCREAMING_SNAKE_CASE`，文件名遵循组件/职责命名（如 `WordCard.tsx`、`srsScheduler.ts`）。
- 保持 UI 扁平化，避免自定义复杂阴影，优先复用设计令牌。

## 测试指引
- 框架：Vitest；若有端到端测试，使用 Playwright。
- 命名：与被测文件同名的 `*.test.ts`/`*.spec.ts` 放于同目录或 `tests/`。
- 覆盖重点：SRS 计算、AI 调用回退、卡片翻转交互、复习流程、Heat Map 数据聚合。
- CI 前确保 `npm run test`、`npm run lint` 通过。

## 提交与 PR
- 提交信息：建议遵循 Conventional Commits（如 `feat: add review queue builder`，`fix: handle offline add fallback`）。
- PR 要求：简述动机与变更点，关联 issue，提供测试说明（命令与结果），涉及 UI 变更请附截图/GIF。
- 保持变更原子化，小步提交，避免与无关文件混改。

## 安全与配置
- API Key 等敏感信息仅放 `.env.local`（不提交）；主进程负责外部请求，通过受限 IPC 暴露。
- 默认关闭远程模块，渲染层启用 `contextIsolation`，禁止直接 `nodeIntegration`。
