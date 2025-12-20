# 当前架构概览

## 目录骨架与职责
- package.json：定义依赖与 npm 脚本，入口指向 dist/main/main.js，dev 并行 Vite + Electron。
- tsconfig.base.json：TypeScript 共用严格基线。
- tsconfig.json：渲染层类型配置（无输出），配合 Vite/React。
- tsconfig.main.json：主进程编译到 dist/main，启用 Node/Electron 类型。
- tsconfig.preload.json：预加载脚本编译到 dist/preload。
- vite.config.ts：Vite 渲染层构建，端口 5173，产物 dist/renderer，别名 @ 指向 src/renderer。
- .gitignore：忽略 node_modules、dist、环境变量、IDE 缓存。
- index.html：渲染入口挂载 #root，加载 src/renderer/main.tsx。
- src/main/main.ts：Electron 主进程创建窗口；dev 加载 Vite 服务，prod 读打包文件；contextIsolation=true、nodeIntegration=false。
- src/preload/index.ts：通过 contextBridge 暴露受限 API（ping 占位）。
- src/renderer/env.d.ts：声明 window.api 类型。
- src/renderer/main.tsx：React 入口，挂载 App 并加载样式。
- src/renderer/App.tsx：占位 UI，验证 preload 与渲染通路。
- src/renderer/index.css：基础视觉样式（扁平、浅色渐变）。
- CLAUDE.md：记录骨架阶段的文件职责与边界。
- prompts/*、memory-bank/*：开发约束与项目背景文档。

## 运行与构建流
- 开发：`npm run dev` 同时启动 Vite（渲染）与 Electron（主进程），通过 `VITE_DEV_SERVER_URL` 加载。
- 构建：`npm run build` 先清理 dist，再分别编译主进程、预加载与渲染层，输出 dist/main、dist/preload、dist/renderer。

## 安全边界
- 渲染层通过 preload 白名单访问 API；默认禁用 nodeIntegration、启用 contextIsolation，减少 Node 能力暴露。
