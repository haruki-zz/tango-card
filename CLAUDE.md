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
- src/main/db/wordService.ts：校验新增单词数据、写入 words 表并同步 daily_activity 计数的服务层。
- src/main/ai/aiClient.ts：AI 请求封装，支持 Gemini/GPT 兼容接口，校验 term 与 API Key，返回标准 ok/error 结构，便于 IPC 层调用与测试注入。
- src/main/ipcHandlers.ts：主进程注册白名单 IPC handler，AI 通道委托 AiClient，DB 通道新增 createWord 写入本地词库，其余通道返回可预测的模拟数据，支持注入自定义 aiClient 与 database。
- src/main/main.ts：Electron 主进程入口，初始化本地 SQLite 后注册 IPC handler 并创建 BrowserWindow；开发模式加载 Vite dev server，生产模式加载打包 renderer；开启 contextIsolation，禁用 nodeIntegration。
- src/preload/createApi.ts：基于 ipcRenderer.invoke 构建暴露给渲染层的 API，实现通道到方法的映射。
- src/preload/index.ts：通过 contextBridge 暴露基于 createApi 的 window.api。
- src/renderer/env.d.ts：声明渲染进程可用的 `window.api` 类型，引用 shared API 定义。
- src/renderer/main.tsx：React 入口，挂载 App 组件并引入全局样式。
- src/renderer/App.tsx：渲染新增单词视图的壳组件。
- src/renderer/features/add-word/AddWordForm.tsx：新增单词核心流程，支持 AI 生成、手动编辑、保存后锁定与重置。
- src/renderer/features/add-word/ExampleFields.tsx：例句输入列表组件，支持增删与独立编辑。
- src/renderer/features/add-word/WordPreviewCard.tsx：新增单词实时/已保存预览组件。
- src/renderer/features/review/ReviewWordCard.tsx：复习用双面卡片组件，正面词+假名、背面释义+例句，点击或空格翻转；index.ts 提供复用导出。
- src/renderer/index.css：全局视觉与布局样式，覆盖新增流程的面板、按钮、预览卡片，并包含复习卡片的 3D 翻转与焦点提示样式。
- tests/smoke.test.ts：基础测试管线占位。
- tests/ai-client.test.ts：验证 AiClient 成功解析、缺失 API Key 与 HTTP 错误路径。
- tests/ipc-boundary.test.ts：验证 createPreloadApi 与主进程 handler 的通路，AI 通道通过 stubbed AiClient，确保 window.api 方法可用。
- tests/db-schema.test.ts：使用内存 SQLite 检查建表字段、默认值、枚举约束和设置表的初始数据。
- tests/word-service.test.ts：验证 createWord 写入默认 SRS 字段并更新 daily_activity 计数。
- tests/add-word-form.test.tsx：使用 React Testing Library 覆盖新增单词表单的生成失败提示、生成成功填充与保存后锁定/重置流程。
- tests/review-word-card.test.tsx：RTL 覆盖复习卡片点击/空格翻转与字段渲染。
- .gitignore：忽略 node_modules、dist、环境变量与 IDE 缓存。
- memory-bank/*、prompts/*、AGENTS.md：项目信息与工作流程约束文档，需在开发前阅读。

## 模块边界与依赖
- 主进程负责窗口、资源加载与 IPC handler 注册；安全选项（contextIsolation=true, nodeIntegration=false）已启用。
- Shared 目录集中定义 IPC 通道和类型，主/预加载/渲染进程共用，保证编译时边界一致。
- Preload 使用 createPreloadApi 将 ipcRenderer.invoke 包装为 window.api 白名单方法，仅暴露 ai/db/settings/files 与 ping。
- 主进程 handler 大部分仍返回可预测的模拟数据，`db:createWord` 已接入 Drizzle/SQLite 并写入 daily_activity，其他通道可逐步替换为真实实现。
- 渲染层完全基于 React/Vite，加载来自主进程的页面，样式与状态管理将继续在此扩展。
