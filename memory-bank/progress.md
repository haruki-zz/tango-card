# 开发进度记录

## 阶段 1：环境与骨架
- 完成步骤：实施计划第 1 步，初始化 Electron + React/Vite + TypeScript 项目结构，建立 db 与 scripts 目录占位。
- 配置内容：添加根级构建/质量配置（package.json 脚本、ESLint Flat、Prettier、Vitest、TS 基线），主进程与渲染进程各自的 tsconfig 与 Vite 配置，预置 React 入口与示例测试。
- 验证结果：`npm run lint`、`npm test` 通过（Vitest；提示 Vite CJS Node API 将弃用，不影响功能）。

## 阶段 1：主进程配置（实施计划第 2 步）
- 完成步骤：配置 Electron 主进程安全项（contextIsolation、禁用 webviewTag、webSecurity 开启、菜单隐藏、ready-to-show 后展示）并添加用户数据目录获取方法。开发模式下新增 dev-runner 引导脚本注册 ts-node，避免主进程入口因 .ts 扩展报错。
- 改动文件：`electron/main.ts`、`electron/dev-runner.js`、`package.json`（dev:electron 指向新引导）。
- 验证结果：`npm run dev` 由用户验证通过，启动不再出现 Unknown file extension 报错。

## 阶段 1：预加载安全桥（实施计划第 3 步）
- 完成步骤：使用 contextBridge 暴露冻结的 `window.electronAPI`，集中封装 word/review/activity/ai 的 IPC 调用，并将频道名与类型独立管理。
- 改动文件：`types/ipc.ts`（请求/响应与实体类型）、`electron/ipc-channels.ts`（白名单频道）、`electron/preload-api.ts`（构建并冻结 API）、`electron/preload.ts`（挂载安全桥）、`renderer/src/types/electron-api.d.ts`（全局类型声明）、`renderer/src/__tests__/preload-api.test.ts`（API 结构与冻结保护测试）。
- 验证结果：`npm test` 通过（包含预加载 API 单测，Vite CJS Node API 弃用提示不影响功能）。
