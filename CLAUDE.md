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
/electron/
  main.ts                 # Electron 主进程入口，创建窗口、加载渲染进程
  preload.ts              # 预加载占位，暴露受控 API 容器
  tsconfig.json           # 主进程专用 TS 配置，输出 dist-electron
/renderer/
  index.html              # Vite 入口 HTML
  vite.config.ts          # Vite 配置（React SWC、输出到 dist）
  tsconfig.json           # 渲染进程 TS 配置与路径别名
  src/
    main.tsx              # React 入口，挂载 App
    App.tsx               # 占位 UI
    App.test.tsx          # React Testing Library 示例测试
    index.css             # 全局基础样式
    setupTests.ts         # Vitest 测试初始化（jest-dom/vitest）
/db/README.md             # 数据库目录占位说明
/scripts/README.md        # 构建/工具脚本目录占位说明
/memory-bank/...          # 产品设计与实施文档（未改动）
/prompt/...               # 提示规范（未改动）
```

## 模块职责与边界
- Electron 主进程：`electron/main.ts` 负责窗口创建与渲染资源加载，预加载脚本路径按 dev/prod 切换；`preload.ts` 预留安全桥。
- 渲染进程：`renderer` 下的 Vite + React 骨架，`App.tsx` 为占位 UI，`App.test.tsx` 验证测试框架与 DOM 渲染管线。
- 构建与质量：`package.json` 定义 dev/lint/test/build/dist 全套脚本；`eslint.config.cjs`、`prettier` 文件约束代码风格；`vitest.config.ts` 配置测试环境与别名。
- 配置复用：`tsconfig.base.json` 作为公共基线，`electron/tsconfig.json`、`renderer/tsconfig.json` 继承各自输出与类型设置。

## 当前依赖与脚本
- Dev：`npm run dev` 并行启动 Vite 与 Electron（ts-node 直跑主进程）。
- 质量：`npm run lint` 使用 ESLint Flat + TypeScript 检查，`npm test` 运行 Vitest + Testing Library。
- 构建/分发：`npm run build` 构建渲染与主进程，`npm run dist` 调用 electron-builder（输出到 release）。
