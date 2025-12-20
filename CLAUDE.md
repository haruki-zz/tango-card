# 项目骨架概览

本文件记录当前初始化阶段的架构意图，方便后续迭代保持一致的模块边界。

## 目录结构与职责
- package.json：npm 脚本、依赖与应用入口指向 `dist/main/main.js`，定义开发/构建/测试占位脚本。
- tsconfig.base.json：TypeScript 共用编译约束（严格模式、ES2021）。
- tsconfig.json：渲染进程 TypeScript 配置，供 Vite/React 使用（无输出，仅类型检查），现包含 shared 类型目录。
- tsconfig.main.json：主进程编译配置，输出到 `dist/main`（CommonJS），编译 shared 边界类型。
- tsconfig.preload.json：预加载脚本编译配置，输出到 `dist/preload`（CommonJS），编译 shared 边界类型。
- vite.config.ts：Vite 构建渲染层，端口 5173，产物写入 `dist/renderer`，base 为 `./` 以适配 file:// 加载。
- index.html：渲染层入口，挂载点 `#root`，引导 `src/renderer/main.tsx`。
- scripts/electron-dev.js：开发模式启动入口，先注册 ts-node（tsconfig.main.json）再加载 main.ts，避免 Electron 直接解析 .ts 报错。
- src/shared/apiTypes.ts：定义 AI/DB/设置/文件等 IPC 数据结构与暴露给渲染层的 ExposedApi 接口。
- src/shared/ipcChannels.ts：集中管理 IPC 通道名常量，避免字符串分散。
- src/main/db/schema.ts：使用 Drizzle 定义 words/review_events/daily_activity/settings 表与 SRS 默认值常量。
- src/main/db/database.ts：封装 better-sqlite3 连接、建表 DDL 与默认设置行插入，提供初始化入口。
- src/main/ipcHandlers.ts：主进程注册白名单 IPC handler，返回可预测的模拟数据（AI 生成、队列、复习反馈、设置读写、导入导出）。
- src/main/main.ts：Electron 主进程入口，初始化本地 SQLite 后注册 IPC handler 并创建 BrowserWindow；开发模式加载 Vite dev server，生产模式加载打包 renderer；开启 contextIsolation，禁用 nodeIntegration。
- src/preload/createApi.ts：基于 ipcRenderer.invoke 构建暴露给渲染层的 API，实现通道到方法的映射。
- src/preload/index.ts：通过 contextBridge 暴露基于 createApi 的 window.api。
- src/renderer/env.d.ts：声明渲染进程可用的 `window.api` 类型，引用 shared API 定义。
- src/renderer/main.tsx：React 入口，挂载 App 组件并引入全局样式。
- src/renderer/App.tsx：占位 UI，验证渲染与 preload 通路。
- src/renderer/index.css：基础样式，提供简洁扁平化的初始视觉风格。
- tests/smoke.test.ts：基础测试管线占位。
- tests/ipc-boundary.test.ts：验证 createPreloadApi 与主进程模拟 handler 的通路，确保 window.api 各方法可用。
- tests/db-schema.test.ts：使用内存 SQLite 检查建表字段、默认值、枚举约束和设置表的初始数据。
- .gitignore：忽略 node_modules、dist、环境变量与 IDE 缓存。
- memory-bank/*、prompts/*、AGENTS.md：项目信息与工作流程约束文档，需在开发前阅读。

## 模块边界与依赖
- 主进程负责窗口、资源加载与 IPC handler 注册；安全选项（contextIsolation=true, nodeIntegration=false）已启用。
- Shared 目录集中定义 IPC 通道和类型，主/预加载/渲染进程共用，保证编译时边界一致。
- Preload 使用 createPreloadApi 将 ipcRenderer.invoke 包装为 window.api 白名单方法，仅暴露 ai/db/settings/files 与 ping。
- 主进程 handler 返回可重复的模拟数据，便于渲染层与测试验证接口存在性，后续可替换为真实实现。
- 渲染层完全基于 React/Vite，加载来自主进程的页面，样式与状态管理将继续在此扩展。
