# 架构说明

## 目录骨架与职责
```
tango-card/
├── package.json             # npm 脚本与依赖定义（dev/lint/test/build/dist）
├── eslint.config.cjs        # ESLint Flat 配置，覆盖 TS/Electron/React
├── tsconfig.base.json       # TypeScript 基线配置（目标/解析/严格模式）
├── tsconfig.json            # 工作区汇总 tsconfig，包含 electron、renderer、vitest.config.ts
├── vitest.config.ts         # Vitest 配置，JS DOM 环境与 @ 别名
├── .prettierrc / .prettierignore / .gitignore  # 代码风格与忽略规则
├── types/
│   └── ipc.ts               # IPC 请求/响应与实体的集中类型声明
├── electron/
│   ├── main.ts              # Electron 主进程入口，创建窗口并加载渲染资源
│   ├── ipc-channels.ts      # IPC 白名单频道常量（word/review/activity/ai）
│   ├── preload-api.ts       # 基于 ipcRenderer.invoke 的 API 工厂，统一调用与冻结
│   ├── preload.ts           # 预加载脚本，构建并暴露 window.electronAPI
│   ├── dev-runner.js        # 开发模式引导，注册 ts-node 后加载主进程入口
│   └── tsconfig.json        # 主进程专用 TS 编译设置，输出 dist-electron
├── renderer/
│   ├── index.html           # Vite HTML 入口，挂载 React 根节点
│   ├── vite.config.ts       # Vite 配置（React SWC、别名、输出路径）
│   ├── tsconfig.json        # 渲染进程 TS 配置，paths/@ 别名
│   └── src/
│       ├── main.tsx         # React 入口，创建根节点并挂载 App
│       ├── App.tsx          # 占位 UI，标记骨架阶段
│       ├── App.test.tsx     # Testing Library 示例测试，验证渲染管线
│       ├── __tests__/preload-api.test.ts # 验证预加载 API 结构与冻结保护
│       ├── index.css        # 全局基础样式
│       ├── setupTests.ts    # Vitest 初始化，注册 jest-dom
│       └── types/
│           └── electron-api.d.ts # 将 window.electronAPI 注入全局类型
├── db/README.md             # 数据库目录占位说明（后续放置 schema/迁移）
├── scripts/README.md        # 构建与辅助脚本目录占位说明
└── memory-bank/…            # 需求、设计、计划与进度文档
```

## 模块边界与作用
- 配置层：`package.json` 聚合脚本（dev 并行 Vite/Electron，lint/test/build/dist），与 ESLint/Prettier/TS/Vitest 配置共同定义项目质量与编译约束。
- 主进程层：`electron/main.ts` 负责窗口生命周期与资源加载，启用 `contextIsolation`、禁用 `webviewTag`、开启 `webSecurity`，仅在 `ready-to-show` 后展示并禁止新窗口弹出；`getUserDataPath` 提供用户数据目录拼接；开发模式通过 `applyDevPreloadSupport` 配置 ts-node；`dev-runner.js` 在启动前注册 ts-node 并加载入口。
- 预加载安全桥：`types/ipc.ts` 统一 IPC 入参与返回类型；`electron/ipc-channels.ts` 收敛频道命名；`electron/preload-api.ts` 基于 ipcRenderer.invoke 构建 word/review/activity/ai 分组并冻结，阻断渲染层对 Node 的直接访问；`electron/preload.ts` 将安全 API 暴露到 `window.electronAPI`。
- 渲染层：`renderer` 目录托管 Vite + React 基线，`main.tsx` 注入根节点，`App.tsx` 提供占位 UI，`index.css` 设定基础排版；`renderer/src/types/electron-api.d.ts` 注入全局类型；`renderer/src/__tests__/preload-api.test.ts` 检查频道调用与冻结保护。`vite.config.ts` 规定输出到 `dist`，便于 Electron 生产模式加载。
- 测试层：`vitest.config.ts` 指向渲染代码与别名，`App.test.tsx` 与 `setupTests.ts` 验证 Testing Library + jest-dom 集成；预加载 API 单测覆盖 IPC 调用路径。
- 占位目录：`db/` 与 `scripts/` 目前仅含 README，预留数据库 schema/迁移与构建辅助脚本的放置位置。

## 约束与后续衔接
- 目录与配置已为后续阶段（IPC、安全桥、数据库、AI 模块）预留路径与脚本；生产构建产物分离为 `dist`（渲染）与 `dist-electron`（主进程）。
- 继续迭代时需同步更新此文件与 `CLAUDE.md`，确保文件职责与目录树变更被记录。
