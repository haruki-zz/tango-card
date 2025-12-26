# 项目架构快照

- 目标：Electron + React/Vite 日语词汇桌面应用，已完成基础骨架，可通过 `npm run dev`/`npm run build` 启动与打包。
- 目录结构：
  - src/
    - main/index.ts：主进程入口，创建 BrowserWindow、绑定 preload，加载 dev URL 或打包文件。
    - preload/index.ts：contextBridge 暴露 platform/node/chrome/electron 版本信息。
    - renderer/index.html：渲染端 HTML 入口。
    - renderer/src/App.tsx|main.tsx|style.css|global.d.ts：React/Vite UI 骨架与类型声明，展示环境版本信息。
  - electron.vite.config.ts：electron-vite 配置（主/预加载输出至 dist-electron，渲染输出 dist，React 插件与路径别名）。
  - electron-builder.yml：electron-builder 打包配置（appId/productName、release 输出、mac dmg+zip、win nsis+portable、linux AppImage，入口 dist-electron/main/index.js）。
  - tsconfig.json：TypeScript 严格模式与路径别名配置。
  - resources/icon.png：打包占位图标（512x512 PNG）。
  - package.json / package-lock.json：ESM 元数据，依赖 Electron/React/Vite/electron-builder，scripts 使用 electron-vite dev/build/preview 并调用 electron-builder。
  - memory-bank/：设计文档、实施计划、架构记录、进度与技术栈说明。
  - prompts/：coding-style 与 system-prompt 约束。
  - AGENTS.md：贡献与约束规则汇总。
  - .gitignore / .env.local：忽略构建产物、环境文件，密钥占位。
- 依赖与模块：已安装 Electron、React、electron-vite、electron-builder、TypeScript；构建产物位于 dist（渲染）、dist-electron（主/预加载），打包输出 release/。
