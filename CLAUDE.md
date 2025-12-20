# 项目骨架概览

本文件记录当前初始化阶段的架构意图，方便后续迭代保持一致的模块边界。

## 目录结构与职责
- package.json：npm 脚本、依赖与应用入口指向 `dist/main/main.js`，定义开发/构建/测试占位脚本。
- tsconfig.base.json：TypeScript 共用编译约束（严格模式、ES2021）。
- tsconfig.json：渲染进程 TypeScript 配置，供 Vite/React 使用（无输出，仅类型检查）。
- tsconfig.main.json：主进程编译配置，输出到 `dist/main`（CommonJS）。
- tsconfig.preload.json：预加载脚本编译配置，输出到 `dist/preload`（CommonJS）。
- vite.config.ts：Vite 构建渲染层，端口 5173，产物写入 `dist/renderer`，base 为 `./` 以适配 file:// 加载。
- index.html：渲染层入口，挂载点 `#root`，引导 `src/renderer/main.tsx`。
- src/main/main.ts：Electron 主进程入口，创建 BrowserWindow，开发模式加载 Vite dev server，生产模式加载打包后的 renderer；开启 contextIsolation，禁用 nodeIntegration。
- src/preload/index.ts：通过 contextBridge 向渲染进程暴露受限 API（占位 ping）。
- scripts/electron-dev.js：开发模式启动入口，先注册 ts-node（tsconfig.main.json）再加载 main.ts，避免 Electron 直接解析 .ts 报错。
- src/renderer/env.d.ts：声明渲染进程可用的 `window.api` 类型。
- src/renderer/main.tsx：React 入口，挂载 App 组件并引入全局样式。
- src/renderer/App.tsx：占位 UI，验证渲染与 preload 通路。
- src/renderer/index.css：基础样式，提供简洁扁平化的初始视觉风格。
- .gitignore：忽略 node_modules、dist、环境变量与 IDE 缓存。
- memory-bank/*、prompts/*、AGENTS.md：项目信息与工作流程约束文档，需在开发前阅读。

## 模块边界与依赖
- 主进程仅负责窗口与资源加载，预留后续 IPC 能力；安全选项（contextIsolation=true, nodeIntegration=false）已启用。
- Preload 作为唯一桥梁向渲染层暴露白名单 API；当前仅有 ping 占位，后续扩展需保持接口集中管理。
- 渲染层完全基于 React/Vite，加载来自主进程的页面，样式与状态管理将继续在此扩展。
