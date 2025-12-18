# 技术栈推荐（简单且健壮）

## 总览
- 桌面壳：Electron（启用 `contextIsolation` + 预加载脚本暴露受控 IPC）。
- 语言与构建：TypeScript + Vite（轻量、热更新快，适配 Electron 渲染进程）。
- 前端框架与样式：React + Tailwind CSS（扁平风格，减少样式手写）+ Headless UI（无样式交互组件）。
- 状态与数据：Zustand（本地 UI 状态）+ React Query（异步/缓存）+ SQLite（better-sqlite3 同步驱动）+ Drizzle ORM（简洁类型安全）。
- 数据交换：IPC 白名单 API（集中在 preload 暴露），渲染层仅调用 typed API。
- AI 调用：基于 `fetch` 的轻封装，支持超时/重试，可插拔 OpenAI/自建接口。
- 测试与质量：Vitest（单测）+ Testing Library（React 交互）+ ESLint/Prettier（基础规范）。
- 打包与分发：electron-builder（多平台产物，配置简单）。

## 选型理由（按层）
- 桌面：Electron 成熟生态、文档完备，覆盖三大桌面平台，少引入新概念。
- 渲染：React 社区最大，配合 Vite 开发体验快；Tailwind/Headless UI 组合在保持极简设计的同时减少样式成本。
- 状态：Zustand 足够轻量；React Query 专注请求/缓存分层，避免重复造轮子。
- 存储：SQLite 稳定小巧，better-sqlite3 同步接口便于主进程调用；Drizzle 提供类型安全 schema 与迁移，体积和学习成本低于大型 ORM。
- IPC：预加载层集中暴露 `word:add/listRandom`、`review:create`、`activity:stats` 等函数，隔离 Node 能力、减少攻击面。
- AI：`fetch` 封装统一重试/超时和 JSON 解析，便于更换后端；不引入额外 SDK 保持精简。
- 质量与打包：Vitest 与 Vite 原生集成，配置少；electron-builder 一站式产物生成，减少脚本维护。
