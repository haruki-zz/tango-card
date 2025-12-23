# 当前架构概览

## 目录骨架与职责（文件树）
/
├─ package.json（依赖与 npm 脚本，dev 并行渲染/预加载 watch/主进程）
├─ tsconfig.base.json / tsconfig.json / tsconfig.main.json / tsconfig.preload.json（TS 基线与分进程配置，preload watch 输出 dist/preload）
├─ vite.config.ts（渲染构建，端口 5173，@ 指向 src/renderer）
├─ vitest.config.ts / playwright.config.ts / eslint.config.cjs / prettier.config.cjs / .gitignore
├─ index.html（渲染入口，挂载 #root）
├─ prompts/*、memory-bank/*（约束与设计文档）
├─ src/
│  ├─ shared/
│  │  ├─ apiTypes.ts（AI/DB/设置/文件/heatmap IPC 类型与 ExposedApi）
│  │  └─ ipcChannels.ts（IPC 通道常量）
│  ├─ main/
│  │  ├─ main.ts（主进程入口，加载 dist/preload/index.js，创建窗口、注册 IPC）
│  │  ├─ ipcHandlers.ts（AI/DB/设置/文件/heatmap 白名单 IPC 注册，settings 落库并同步 AiClient，支持依赖注入）
│  │  ├─ ai/aiClient.ts（AI 客户端封装，校验 term/API Key，统一 ok/error）
│  │  └─ db/
│  │     ├─ database.ts（better-sqlite3 初始化、建表、settings 种子）
│  │     ├─ schema.ts（Drizzle 表定义与 SRS 默认常量）
│  │     ├─ settingsService.ts（读取/更新 settings 单行表，归一化模型/批次大小/主题与 API Key）
│  │     ├─ wordService.ts（新增词写库与 daily_activity 计数）
│  │     ├─ reviewService.ts（SM-2 评分更新、事件记录与 daily_activity 增量）
│  │     ├─ reviewQueueService.ts（到期优先、随机新卡补足、上限 30）
│  │     ├─ activityService.ts（daily_activity 聚合近 12 个月 Heat Map 数据）
│  │     └─ timeUtils.ts（UTC 日/周起点工具，DAY_SECONDS 常量）
│  ├─ preload/
│  │  ├─ createApi.ts（ipcRenderer.invoke → window.api 映射）
│  │  └─ index.ts（contextBridge 暴露 createApi，产物 dist/preload/index.js）
│  └─ renderer/
│     ├─ env.d.ts（window.api 类型声明）
│     ├─ main.tsx（React 入口）
│     ├─ App.tsx（新增/复习/Heat Map/设置 壳）
│     ├─ index.css（全局样式：新增、复习卡片 3D、Heat Map 网格/图例、设置布局）
│     └─ features/
│        ├─ add-word/（AddWordForm、ExampleFields、WordPreviewCard）
│        ├─ review/（ReviewSession、ReviewWordCard）
│        ├─ heatmap/（ActivityHeatMap、heatmapUtils）
│        └─ settings/（SettingsPanel 设置视图）
├─ tests/
│  ├─ ai-client.test.ts / ipc-boundary.test.ts / db-schema.test.ts / word-service.test.ts
│  ├─ review-queue.test.ts / review-service.test.ts / review-session.test.tsx / review-word-card.test.tsx
│  ├─ activity-service.test.ts / heatmap-utils.test.ts / add-word-form.test.tsx / settings-service.test.ts / settings-panel.test.tsx / smoke.test.ts
└─ e2e/
   └─ smoke.spec.ts（Playwright 占位）

## 运行与构建流
- 开发：`npm run dev` 同时启动 Vite（渲染）、preload watch 与 Electron（主进程），通过 `VITE_DEV_SERVER_URL` 加载；主进程固定读取 dist/preload/index.js。
- 构建：`npm run build` 先清理 dist，再分别编译主进程、预加载与渲染层，输出 dist/main、dist/preload、dist/renderer。
- 数据库：默认 sqlite 存储路径为 `TANGO_CARD_DB_PATH` 环境变量指定，否则使用 Electron `userData` 目录中的 `tango-card.sqlite`，再退回 cwd；测试可用 `:memory:`。
## 质量与测试
- 静态检查：`npm run lint` 使用 ESLint + Prettier 规则；`npm run format` 统一代码风格。
- 单元/集成：`npm run test` 运行 Vitest（JSdom）。
- 端到端：`npm run e2e` 运行 Playwright（headless，占位场景）。

## 安全边界
- 渲染层通过 preload 白名单访问 API，通道集中在 shared/ipcChannels；默认禁用 nodeIntegration、启用 contextIsolation，减少 Node 能力暴露。
