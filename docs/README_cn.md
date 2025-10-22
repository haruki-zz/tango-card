# tango-card 项目说明

## 项目简介
tango-card 是一款基于 TypeScript、React 与 Electron 的桌面应用，帮助用户通过可视化 SVG 单词卡掌握日语词汇（“tango” 即日语中的 “单词”）。Electron 负责桌面容器与系统集成，React 提供界面呈现与交互，TypeScript 覆盖所有业务逻辑以保证类型安全。应用侧重于创建、管理与复习自定义的 SVG 单词卡片，并通过记忆等级与学习日历反馈学习进度。

## 核心功能规划
- **SVG 渲染**：接收用户粘贴或导入的 SVG 源码，在渲染进程中自适应窗口尺寸展示。
- **自动保存**：每张卡片包含 SVG 内容、创建时间、标签、记忆等级，并自动保存到本地。
- **智能复习**：随机抽取卡片复习，优先推送记忆等级低的卡片，支持自定义标记（熟知、不太熟等）。
- **学习进度面板**：提供类似 GitHub contribution 的热力图，直观展示学习频率与趋势。

## 推荐目录结构
```
. (项目根目录)
├─ src/                    # TypeScript 源码（Electron 主进程 / React 渲染进程 / 领域层）
├─ assets/                 # 静态资源（图标、示例 SVG 等）
├─ tests/                  # 单元、集成与端到端测试
├─ config/                 # 配置文件与环境变量模板
└─ docs/                   # 项目文档（TODO、架构、规范等）
```

## 开发与运行
- 安装依赖：`npm install` 或 `pnpm install`
- 开发模式：`npm run dev`（Electron 主进程 + Vite 驱动的 React 渲染进程热加载）
- 构建应用：`npm run build`（打包 Electron 并输出到 `dist/`）
- 执行测试：`npm test`（建议保持 Jest 覆盖率 ≥90%，React 组件可使用 Testing Library）

## 后续工作
详细任务拆分请参见 `docs/TODO.md`，技术栈分工说明见 `docs/stack_responsibility.md`。欢迎在 issue 中提出新想法或反馈，提交 PR 前请先讨论以确保方向一致。
