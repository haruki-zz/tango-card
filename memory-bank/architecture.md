# 架构记录

## 阶段状态
- 已完成实施计划第 3 步：接入 ESLint + Prettier 统一规范，`npm run lint` 全量通过；后续继续补充共享类型与 SM-2 逻辑。

## 文件作用
- package.json：项目元数据，使用 ESM，声明 Node >=18 要求与 Electron/React/Vite/TypeScript 依赖；scripts 含 electron-vite dev/build/preview、lint/lint:fix、format/format:fix，build 调用 electron-builder 产出安装包。
- package-lock.json：npm 锁定文件（包含 Electron、React、构建链依赖）。
- .gitignore：忽略 node_modules、构建产物（dist、dist-electron、release）、日志、.env.* 与 .vite。
- .env.local：存放 OpenAI/Google 密钥占位，避免读取缺失时报错，默认不提交。
- .eslintrc.cjs：全局 ESLint 配置，启用 TypeScript/React/React Hooks/Prettier 规则集，设置浏览器与 Node 环境覆盖 main/preload/renderer，忽略 dist/dist-electron/release/out/node_modules。
- prettier.config.cjs：Prettier 配置，统一单引号。
- electron.vite.config.ts：electron-vite 配置，定义 main/preload 输出目录与 React 插件、渲染端别名。
- electron-builder.yml：electron-builder 打包配置，指定 appId/productName、输出目录（release）、macOS/Windows/Linux 目标与主入口。
- tsconfig.json：TypeScript 编译配置，启用 strict，路径别名覆盖 main/preload/renderer。
- resources/icon.png：占位应用图标（512x512 PNG），供 electron-builder 使用。
- src/main/index.ts：主进程入口，创建 BrowserWindow、绑定 preload、处理 URL/文件加载与生命周期。
- src/preload/index.ts：预加载脚本，通过 contextBridge 暴露平台与版本信息。
- src/renderer/index.html：渲染进程 HTML 入口。
- src/renderer/src：渲染进程 React/Vite 骨架（App.tsx 展示版本信息、main.tsx 挂载、基础样式与类型声明）。
- CLAUDE.md：仓库当前架构快照，描述目录与文件职责，需随架构变更同步。
- AGENTS.md：贡献规范与全局约束的入口说明。
- prompts/coding-style.md：代码风格与开发流程约定。
- prompts/system-prompt.md：系统级工作规范与思考模式。
- memory-bank/design-document.md：产品功能与数据设计说明。
- memory-bank/implementation-plan.md：分步实施计划，当前执行至第 2 步。
- memory-bank/tech-stack.md：技术栈清单与选型理由。
- memory-bank/progress.md：阶段性变更记录，便于交接。
- memory-bank/architecture.md：架构与文件职责记录（本文件），持续更新各阶段的结构洞察。
