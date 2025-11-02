# tango-card 项目说明

## 项目简介
tango-card 是一款基于 TypeScript、React 与 Electron 的桌面应用，帮助用户通过可视化 SVG 单词卡掌握日语词汇（“tango” 即日语中的 “单词”）。Electron 负责桌面容器与系统集成，React 提供界面呈现与交互，TypeScript 覆盖所有业务逻辑以保证类型安全。应用侧重于创建、管理与复习自定义的 SVG 单词卡片，并通过记忆等级与学习日历反馈学习进度。

## 核心功能规划
- **SVG 渲染**：接收用户粘贴或导入的 SVG 源码，在渲染进程中自适应窗口尺寸展示，并提供空状态与异常提示。
- **卡片编辑**：支持输入单词本身、平假名读音、语境描述与例句，模板会根据内容自动换行、缩放以保持统一尺寸的 SVG 卡片；填写完成后可选择记忆等级并手动保存到本地。
  卡片数据在 `src/domain/card` 内定义为 `CardEntity`，并通过 `card_factory.ts` 统一校验与生成，确保字段完整。卡片渲染模板会将四项输入（单词、平假名、语境、例句）排版到统一宽高的画布中，便于后续复习界面的统一展示与裁切。
- **智能复习**：基于记忆等级权重的随机抽取队列，优先推送记忆等级低的卡片，支持自定义标记（熟知、不太熟等，配置位于 `src/shared/constants/memory_levels.ts`），并提供数字键/方向键与左右、上下滑动操作加速打分。
- **学习进度面板**：提供类似 GitHub contribution 的热力图，按周栅格展示每日学习频率，可在“综合活动 / 每日新增 / 复习次数”之间切换，并附带记忆等级分布概览，直观呈现趋势。
- **数据备份**：设置页支持 JSON/ZIP 备份导入/导出，包含卡片、复习记录与学习统计，便于跨设备迁移。
- **界面风格**：渲染层引入 Tailwind CSS + 自定义全局样式，快速搭建深色主题与组件排版。
- **状态协调**：渲染层通过 Zustand store 管理卡片列表与复习队列，hooks 统一封装与 IPC 同步逻辑。

## 主界面布局（竖屏优先）
主界面遵循 UI 目录下 `UI/main-interface.svg` 的设计稿，按照自上而下的四段式结构组织：
- **搜索栏**：通栏圆角输入框，右端集成“➕” 行动按钮；用户可在现有词库中快速检索单词，并随时创建新词条。
- **学习热力图区**：紧接搜索栏显示最近五个月的活跃热力图，采用 GitHub contribution 风格的 7×N 栅格（首行对应 Sunday，按周排列、左侧隔日标注星期、顶部以每五列为一月标记月份），小方块约为 10×10 像素且间距收窄，支持左右滑动查看更多历史数据，突出连续打卡节奏。
- **精选单词卡**：中部展示随机抽取的单词卡，完整呈现“单词 / 平假名读音 / 语境 / 场景 / 例句”，帮助用户在主界面快速回顾。
- **复习入口**：底部保留一体化的“Start Review” 胶囊按钮，点击后立即进入复习流程。

容器侧继续使用安全区域内边距与统一宽度的卡片布局（Tailwind `flex-col`、`gap` 样式），并强调“极简 + 圆角矩形”设计语言：背景留白、阴影收敛、强调主要行动按钮的视觉层级。四个主模块的高度占比约为 1（搜索栏）：3（热力图）：5（单词卡）：1（复习按钮），顶部搜索栏与底部 “Start Review” 按钮到屏幕边缘的留白保持对称；任何 UI 调整均需对照 `UI/` 设计稿保持一致。

## UI 设计稿参考
- `UI/` 目录存放界面级设计稿（SVG、交互说明等）。新增或修改 UI 代码前，必须对照对应设计稿并在 PR 描述中标注所依据的文件路径。
- 如果设计稿需要调整，请同步更新 `UI/` 内资源并在 `docs/TODO.md` 中登记，确保后续迭代能检视差异。

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
