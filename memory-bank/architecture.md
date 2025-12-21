# 当前架构概览

## 目录骨架与职责
- package.json：定义依赖与 npm 脚本，入口指向 dist/main/main.js，dev 并行 Vite + Electron。
- eslint.config.cjs：ESLint 统一规则（TS/React/JSX-a11y/Prettier），兼容主进程 CommonJS 脚本。
- prettier.config.cjs：Prettier 样式基线。
- tsconfig.base.json：TypeScript 共用严格基线。
- tsconfig.json：渲染层类型配置（无输出），配合 Vite/React。
- tsconfig.main.json：主进程编译到 dist/main，启用 Node/Electron 类型。
- tsconfig.preload.json：预加载脚本编译到 dist/preload。
- vite.config.ts：Vite 渲染层构建，端口 5173，产物 dist/renderer，别名 @ 指向 src/renderer。
- vitest.config.ts：Vitest 测试配置，JSdom 环境与 @ 别名支持。
- playwright.config.ts：Playwright 端到端测试配置，占位 headless 场景。
- .gitignore：忽略 node_modules、dist、测试产物（coverage/playwright-report/test-results）、环境变量、IDE 缓存。
- index.html：渲染入口挂载 #root，加载 src/renderer/main.tsx。
- src/shared/apiTypes.ts：定义 ai/db/settings/files IPC 数据结构与渲染可见 ExposedApi 接口。
- src/shared/ipcChannels.ts：集中管理 IPC 通道名，主/预加载/渲染共用。
- src/main/ai/aiClient.ts：主进程 AI 客户端封装，支持 Gemini/GPT 兼容接口，校验 term 与 API Key，输出标准 ok/error 结构供 IPC 调用。
- src/main/main.ts：Electron 主进程创建窗口，初始化数据库后注册 IPC handler；dev 加载 Vite 服务，prod 读打包文件；contextIsolation=true、nodeIntegration=false。
- src/main/ipcHandlers.ts：主进程注册白名单 IPC handler，AI 通道委托 AiClient，db 通道包含 createWord 真实写库，其余通道仍返回可预测 mock，支持注入 aiClient/database 便于测试。
- src/main/db/wordService.ts：校验新增单词数据、写入 words 表并同步 daily_activity 计数的服务层。
- src/preload/createApi.ts：基于 ipcRenderer.invoke 构建 window.api 映射。
- src/preload/index.ts：通过 contextBridge 暴露基于 createApi 的 API。
- src/renderer/env.d.ts：声明 window.api 类型，引用 shared/apiTypes。
- src/renderer/main.tsx：React 入口，挂载 App 并加载样式。
- src/renderer/App.tsx：渲染新增单词页面的壳组件。
- src/renderer/features/add-word/AddWordForm.tsx：新增单词核心流（AI 生成、手动编辑、保存后锁定、重置新条目）。
- src/renderer/features/add-word/ExampleFields.tsx：例句输入列表组件，支持增删与独立编辑。
- src/renderer/features/add-word/WordPreviewCard.tsx：新增词条实时/已保存预览。
- src/renderer/index.css：全局视觉样式，覆盖新增流程的布局、按钮、预览卡片。
- tests/smoke.test.ts：Vitest 占位用例，验证测试管线通畅。
- tests/ai-client.test.ts：覆盖 AiClient 成功解析、缺少 API Key、HTTP 错误返回路径。
- tests/ipc-boundary.test.ts：模拟 ipc bus 驱动 handler，验证 window.api 白名单接口、AI stub 响应与 db:createWord 写库。
- e2e/smoke.spec.ts：Playwright 占位场景，验证 e2e 管线运行。
- tests/word-service.test.ts：验证 createWord 的必填校验、默认 SRS 字段与 daily_activity 计数更新。
- tests/add-word-form.test.tsx：React Testing Library 覆盖生成失败提示、成功填充、保存后锁定与重置流程。
- CLAUDE.md：记录骨架阶段的文件职责与边界。
- prompts/*、memory-bank/*：开发约束与项目背景文档。

## 运行与构建流
- 开发：`npm run dev` 同时启动 Vite（渲染）与 Electron（主进程），通过 `VITE_DEV_SERVER_URL` 加载。
- 构建：`npm run build` 先清理 dist，再分别编译主进程、预加载与渲染层，输出 dist/main、dist/preload、dist/renderer。
## 质量与测试
- 静态检查：`npm run lint` 使用 ESLint + Prettier 规则；`npm run format` 统一代码风格。
- 单元/集成：`npm run test` 运行 Vitest（JSdom）。
- 端到端：`npm run e2e` 运行 Playwright（headless，占位场景）。

## 安全边界
- 渲染层通过 preload 白名单访问 API，通道集中在 shared/ipcChannels；默认禁用 nodeIntegration、启用 contextIsolation，减少 Node 能力暴露。
