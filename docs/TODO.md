# tango-card TODO

> 技术栈职责、模块边界详见 `docs/stack_responsibility.md` 与 `docs/architechture.md`。

## MVP 功能
- [x] 解析用户输入的 SVG 源码并在 React 渲染层以窗口自适应方式展示（由 Electron 容器托管）。
- [x] 建立 TypeScript 单词卡片数据模型（SVG 源、创建时间、标签、记忆等级）。
- [x] 实现 Electron 主进程驱动的自动保存流程，将卡片写入本地持久化存储（IndexedDB/SQLite/文件系统待定）。
- [x] 提供 TypeScript 服务计算的随机抽取接口，同时支持按照记忆等级权重优先低熟悉度卡片。
- [x] 在 React 复习视图中允许用户为卡片设置记忆等级（熟知、不太熟等可配置标签）。
- [x] 构建 React 组件实现的 GitHub contribution 风格可视化面板显示每日学习进度。

## 技术任务
- [x] 规划 Electron 主进程与 React 渲染进程通信协议（contextBridge、IPC channel）。
- [x] 引入 React 友好的状态管理方案（如 Redux Toolkit 或 Zustand）协调卡片状态与复习队列。
- [x] 设计 TypeScript 持久化层抽象，支持未来迁移不同存储引擎。
- [x] 配置 TypeScript、ESLint、Prettier、Vite（或同类）以获得统一开发体验，并建立 React + Electron 联调脚本。
- [x] 搭建端到端测试框架（Playwright + Spectron 或类似）验证核心用户流程。

## 体验与可用性
- [x] 为 SVG 预览增加错误提示与空状态文案。
- [x] 在卡片复习时提供快捷键与触控支持，提升学习效率（方向键与多方向滑动已支持）。
- [x] 设计进度统计维度（每日新增、复习次数、记忆等级分布）并与面板联动（热力图维度切换 + 等级分布面板上线）。
- [x] 支持导入/导出卡片数据（JSON/ZIP）便于备份与迁移（设置页提供备份工具，含复习记录与统计）。
