# 技术栈推荐（最简单且健壮）

## 桌面与构建
- Electron，主进程 TypeScript，渲染进程通过 ContextBridge 暴露受限 API。
- Vite + React + TypeScript：快速开发与热更新，保留 JSX 开发体验。
- Electron Builder：跨平台打包 `.dmg` / `.msi` / `.exe`，配合代码签名。
- 包管理：统一使用 `npm`，内置脚本 `npm run dev` / `npm run build`.

## 前端 UI
- React 18：成熟生态与组件模式。
- Tailwind CSS：最少定制即可实现扁平、统一的设计令牌。
- Headless UI 或 Radix Primitives（按需）：提供无样式可访问组件，减少造轮子（如对话框、弹层）。

## 状态与数据
- 前端状态：Zustand（轻量、简洁 API），用于视图状态和会话数据。
- 本地数据库：SQLite + better-sqlite3（同步、稳健），由主进程封装 CRUD。
- 数据访问层：Drizzle ORM（类型安全且轻量），建表/迁移简单。
- 日期处理：Day.js（小巧、API 简洁）用于到期计算与 Heat Map 聚合。

## IPC 与安全
- Electron `contextBridge` + `ipcRenderer`/`ipcMain`：白名单式 API，屏蔽 Node 能力，防止直接访问文件系统。
- 主进程暴露模块：AI 调用、数据库、设置读写、文件导入导出。

## AI 调用
- Axios（成熟稳定）在主进程请求 OpenAI 兼容接口；渲染进程仅通过 IPC 触发。
- 失败回退：允许渲染层提供手动输入，主进程记录失败状态。

## 测试与质量
- Vitest：单元/逻辑测试（SRS 计算、数据层）。
- Playwright：关键用户流端到端（新增、复习、翻卡、热力图展示）。
- ESLint + Prettier：基础代码规范。

## 日志与崩溃
- 主进程：electron-log；渲染进程：console 转发到主进程。
- 可选 sentry-electron（若需线上监控）。
