# 技术栈职责划分

本文档明确 TypeScript、React、Electron 在 tango-card 项目中的分工，以确保模块职责清晰、实现一致。

## TypeScript
- 提供统一的类型系统，覆盖 `src/` 下所有逻辑。
- 实现领域模型与业务策略（`src/domain`、`src/renderer_process/services`、`src/shared`）。
- 定义 IPC 通信契约、存储接口与通道常量（`src/main_process/ipc_channels.ts`、`src/infrastructure`）。
- 维护跨存储引擎的抽象层（`storage_driver.ts`、`storage_engine.ts`），确保持久化实现可插拔。
- 管理数据持久化、调度与计算逻辑，保证纯函数、可测试。
- 维护工具函数、错误类型和结果封装，支撑 React 与 Electron 的调用。

## React
- 构建用户界面与交互体验，位于 `src/renderer_process`。
- 通过组件、hooks 和状态容器处理 UI 状态，调用 TypeScript 服务执行业务。
- 负责 SVG 画布展示、复习流程、记忆等级标记与学习进度可视化。
- 使用 Tailwind CSS + 自定义全局样式实现主题和布局，避免散落的内联样式。
- 使用 TypeScript 类型定义 props、状态与上下文，确保组件组合的可靠性。
- 集成 Testing Library 等工具编写组件级测试。

## Electron
- 管理桌面容器、窗口生命周期、安全边界，集中在 `src/main_process` 与 `src/preload`.
- 通过 IPC 桥接 React 渲染进程与系统资源，确保最小权限原则。
- 提供文件系统、数据目录访问能力，协调持久化驱动初始化。
- 负责数据备份导入/导出的对话框与文件写入，保障用户备份流程。
- 负责应用打包、自动更新（如启用）和平台特性（菜单、托盘、快捷键）。
- 在 preload 层暴露受控 API，避免渲染进程直接访问 Node 底层。
