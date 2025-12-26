# 技术栈（简洁且成熟）
- 桌面容器：Electron（成熟生态，跨平台文件/IPC/打包支持）。
- 前端框架：React + Vite（快速开发与热更新）；语言统一 TypeScript。
- 状态管理：Zustand（轻量、简单函数式 API，足够覆盖词库/会话状态）。
- 样式方案：原子化程度适中的 Tailwind CSS（减少手写样式与命名负担，保持扁平简洁风格），必要时辅以少量自定义 CSS 变量。
- 进程通信：Electron IPC（主进程封装文件读写与 LLM 请求，渲染进程仅调用受控接口）。
- 数据持久化：Node 原生 fs 流式读写 JSONL/JSON（存放于 `app.getPath('userData')` 下，无额外数据库依赖）。
- 构建与打包：Vite 前端构建 + electron-builder（生成 macOS dmg/zip 与 Windows nsis/portable）。
- 测试与质量：Vitest + React Testing Library（组件/逻辑单测）；ESLint + Prettier（基础代码规范）。
