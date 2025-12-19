# 项目骨架与架构备注

## 目录概览
```
/CLAUDE.md                # 架构速览（本文件）
/package.json             # npm 配置与脚本入口（dev/lint/test/build/dist）
/eslint.config.cjs        # ESLint Flat 配置（TS/React/Electron）
/tsconfig.base.json       # TypeScript 基础配置
/tsconfig.json            # 工作区汇总 tsconfig，包含 electron 与 renderer
/vitest.config.ts         # Vitest 配置（JS DOM、别名 @ -> renderer/src）
/.prettierrc              # Prettier 规范
/.prettierignore          # Prettier 忽略列表
/.gitignore               # Git 忽略列表
/types/ipc.ts             # IPC 请求/响应与实体的集中类型声明
/electron/
  main.ts                 # Electron 主进程入口，创建窗口、加载渲染进程
  ipc-channels.ts         # IPC 白名单频道常量
  preload-api.ts          # 构建并冻结预加载 API 的工厂
  preload.ts              # 预加载脚本，暴露 window.electronAPI
  dev-runner.js           # 开发模式引导：注册 ts-node 后再加载主进程入口
  tsconfig.json           # 主进程专用 TS 配置，输出 dist-electron
/renderer/
  index.html              # Vite 入口 HTML
  vite.config.ts          # Vite 配置（React SWC、输出到 dist）
  tsconfig.json           # 渲染进程 TS 配置与路径别名
  src/
    main.tsx              # React 入口，挂载 App
    App.tsx               # 占位 UI
    App.test.tsx          # React Testing Library 示例测试
    __tests__/preload-api.test.ts # 验证预加载 API 形状与调用的单测
    index.css             # 全局基础样式
    setupTests.ts         # Vitest 测试初始化（jest-dom/vitest）
    types/electron-api.d.ts # 注入 window.electronAPI 的全局类型
/db/README.md             # 数据库目录占位说明
/scripts/README.md        # 构建/工具脚本目录占位说明
/memory-bank/...          # 产品设计与实施文档（未改动）
/prompt/...               # 提示规范（未改动）
```

## 模块职责与边界
- Electron 主进程：`electron/main.ts` 负责窗口创建与渲染资源加载，预加载脚本路径按 dev/prod 切换；启用 contextIsolation、webSecurity，禁用 webviewTag，ready-to-show 后展示并禁止窗口打开；`getUserDataPath` 提供用户数据目录拼接；`dev-runner.js` 在开发模式注册 ts-node 以支持直接运行 TS 主进程与预加载。
- 预加载安全桥：`types/ipc.ts` 集中声明 word/review/activity/ai 的入参与返回类型；`electron/ipc-channels.ts` 统一 IPC 白名单频道；`electron/preload-api.ts` 利用 ipcRenderer.invoke 构建 API 并冻结对象；`electron/preload.ts` 通过 contextBridge 暴露 window.electronAPI，避免渲染层直接访问 Node。
- 渲染进程：`renderer` 下的 Vite + React 骨架，`App.tsx` 为占位 UI；`renderer/src/types/electron-api.d.ts` 将 preload 暴露的 API 写入全局类型；`renderer/src/__tests__/preload-api.test.ts` 覆盖 API 形状、频道调用与冻结保护。
- 构建与质量：`package.json` 定义 dev/lint/test/build/dist 全套脚本；`eslint.config.cjs`、`prettier` 文件约束代码风格；`vitest.config.ts` 配置测试环境与别名。
- 配置复用：`tsconfig.base.json` 作为公共基线，`electron/tsconfig.json`、`renderer/tsconfig.json` 继承各自输出与类型设置。

## 当前依赖与脚本
- Dev：`npm run dev` 并行启动 Vite 与 Electron（ts-node 直跑主进程）。
- 质量：`npm run lint` 使用 ESLint Flat + TypeScript 检查，`npm test` 运行 Vitest + Testing Library。
- 构建/分发：`npm run build` 构建渲染与主进程，`npm run dist` 调用 electron-builder（输出到 release）。
