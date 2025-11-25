# tango-card 项目说明

## 项目简介
tango-card 是一款基于 TypeScript、React 与 Electron 的桌面应用，帮助用户通过自定义 SVG 单词卡掌握日语词汇（“tango” 即“单词”）。当前版本聚焦两个核心场景：

1. **创建单词卡**：输入单词、平假名读音、语境与例句，模板会将四项信息排版到统一尺寸的 SVG 中并保存到本地。
2. **复习单词卡**：随机抽取一定数量的卡片，逐张阅读并标记为已复习。

除这两个流程外，其余分析类面板、备份工具、复杂仪表盘均已移除，确保应用保持轻量。

## 核心能力
- **统一的 SVG 模板**：`src/shared/templates/card_svg_template.ts` 将四项输入渲染为固定画布，保证复习界面始终使用一致的尺寸与排版。
- **复习策略**：`src/domain/review` 中的策略将所有卡片均等看待，随机抽取一小批进行复习。
- **复习交互**：复习界面支持点击按钮、键盘快捷键（1/2/3 与方向键）以及滑动手势，方便在桌面设备或触控板上快速录入。
- **本地持久化**：Electron 主进程通过文件存储的仓库 (`CardRepository` / `ReviewSessionRepository`) 同步数据，渲染层使用 IPC 调用 API。

## 界面结构
- **入口界面**：中心卡片内展示两枚 CTA（创建/复习）与一份状态板。
- **编辑界面**：左侧为表单（单词、平假名、上下文、例句），右侧为实时 SVG 预览。
- **复习界面**：上方提供“Start review” 按钮及队列说明；下方分为卡片展示区与单一“Mark as reviewed” 操作区，强调最少动作。

整体 UI 使用淡色、Neumorphism 风格的圆角块与柔和阴影，便于在桌面端长时间使用。

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
- 类型检查：`npm run typecheck`（同时验证主进程与渲染进程 TypeScript 配置）
- 执行测试：`npm test`（建议保持 Jest 覆盖率 ≥90%，React 组件可使用 Testing Library）
- 端到端测试：`npm run test:e2e`（Playwright 驱动 Electron 流程，首次运行前执行 `npx playwright install --with-deps`）
- 发布前自检：`npm run release`（依次执行 typecheck、lint、unit test 与 build）
- 浏览器预览：直接访问 Vite Dev Server（如 `http://localhost:5173`）时，渲染层会启用内存 Mock 的 Renderer API，便于在缺少 Electron 容器的情况下调试界面；在 Electron 中运行则会连接真实 IPC。
- 样式开发：Tailwind 配置位于 `tailwind.config.cjs`，通过 `@tailwindcss/postcss` 插件接入 PostCSS；全局入口为 `src/renderer_process/styles/global.css`，必要时可结合自定义 CSS 扩展。
- 存储引擎：`src/infrastructure/persistence/storage_engine.ts` 建立统一注册表，当前默认启用文件系统引擎（`file`），后续可根据部署场景扩展 SQLite 等实现。

## 后续工作
 详细任务拆分请参见 `docs/TODO.md`，技术栈分工说明见 `docs/stack_responsibility.md`。开发工具链、联调与端到端测试说明见 `docs/development_setup.md`。欢迎在 issue 中提出新想法或反馈，提交 PR 前请先讨论以确保方向一致。
- IPC 通信契约记录于 `docs/ipc_protocol.md`，新增通道需同步完善类型与文档。
