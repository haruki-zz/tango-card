## 2026-01-05T00:48:17Z
- 完成实施计划第 21 步：响应式与可访问性验收，定义 4 档断点并补足焦点/提示的可达性。
- `tailwind.config.cjs`：显式配置 640/768/960/1200/1536 断点，对齐设计断点区间。
- `src/renderer/src/App.tsx`：不同宽度下三列→两列→单列的布局切换，右侧面板在中等视口堆叠到底部，工具栏按钮禁用退出 Tab 流。
- `src/renderer/src/components/AddWordForm.tsx`：表头与输入区在窄屏堆叠，今日摘要块全宽显示，状态提示添加 aria-live/role。
- `src/renderer/src/components/ReviewSession.tsx` + `src/renderer/src/style.css`：评分按钮在 ≥960px 单行、窄屏双行，焦点态描边强化，消息区域 aria-live。
- `src/renderer/src/components/ImportExportPanel.tsx`：导入触发改为可聚焦的伪按钮，支持回车/空格触发并在忙碌时阻断交互与添加焦点描边。
- `src/renderer/src/components/SettingsPanel.tsx`：底部操作区窄屏换行，提示文本补充 aria-live/alert。
- 测试由用户执行并确认通过。

## 2026-01-04T10:26:19Z
- 完成实施计划第 20 步：右侧活跃度与数据面板重构，热力图改为 5x7 方格并按 0/1–3/4–6/7–14/15+ 固定绿阶映射，新增今日合计/新增/復習分栏与日文 tooltip 文案。
- `src/renderer/src/components/ActivityHeatmap.tsx`：移除动态 max 归一化，使用分档色阶，追加今日摘要卡片并调整 hover/aria 描述。
- `src/renderer/src/components/ImportExportPanel.tsx`：描边按钮状态标签改为“已就绪/导出中”，成功与错误提示改为描边块强化可见性。
- `src/renderer/src/components/SettingsPanel.tsx`：已保存密钥显示标记与遮蔽占位，提示覆盖逻辑，保持 mock 免密钥分支。
- 测试由用户执行并确认通过。

## 2026-01-04T01:17:06Z
- 完成实施计划第 19 步：复习卡片立体描边风格、Y 轴翻转动效与进度条/百分比展示，补齐 0–5 评分按钮、左右箭头切换与键盘快捷键提示（空格/Enter 翻面、数字键评分、方向键导航）。
- `src/renderer/src/components/ReviewSession.tsx`：支持多卡片导航、长词字号自适应、进度条 aria 属性与快捷键监听，评分后自动推进队列并保持 session 计数逻辑。
- `src/renderer/src/style.css`：新增进度条、翻转卡片、描边虚线与评分按钮样式，统一提示消息与键盘提示徽标。
- `src/renderer/src/__tests__/ReviewSession.test.tsx`：补充进度/导航与键盘交互路径覆盖，验证评分行为与 session 计数。
- 测试由用户执行并确认通过。

## 2026-01-03T05:29:11Z
- 完成实施计划第 16 步：打包与发布烟测，确保生产构建加载打包后的渲染入口并提供可重复的打包脚本。
- `src/main/index.ts` 生产分支改为加载 `dist/index.html`，避免打包后找不到渲染入口。
- `package.json` 抽出 `build:dist`，`build` 复用并新增 `pack`（`electron-builder --dir`），便于快速生成未签名包做回归。
- 已跑通 `npm run build`（生成 dmg/zip；签名因无证书跳过）与 `npm run pack`，打包链路验证通过；测试由用户执行并确认通过。

## 2026-01-03T07:20:00Z
- 完成实施计划第 18 步：主界面改为 24%/46%/30% 三列栅格，顶部加入设置/全屏/明暗占位的工具栏与虚线分隔；左列整合新增与最近词条，右列堆叠活跃度、导入导出与 Provider 设置。
- 新增区视觉重写：单词输入改为日文占位与描边按钮，生成结果卡片采用 Noto Serif JP，提示条改为浅橙背景并强化状态文案。
- 测试由用户执行并确认通过。

## 2026-01-03T06:05:00Z
- 完成实施计划第 17 步：落地 UI 设计规范主题与资源，将琥珀主色、绿阶活跃度色板、字体与阴影转为全局 CSS 变量并接入 Tailwind 主题。
- `tailwind.config.cjs` 改为读取 CSS 变量映射 accent/leaf/ink 等色板与字体/阴影配置；`src/renderer/src/style.css` 引入纸纹理背景、基础按钮/输入/卡片/图标样式与动效时序变量。
- 渲染组件切换到新基底样式与配色：新增表单、设置、导入导出、复习、词表统一按钮/输入描边与面板底色；活跃度热力图改用绿阶映射并更新提示容器。
- 测试由用户执行并验证通过。

## 2026-01-03T04:31:52Z
- 完成实施计划第 15 步：LLM provider 设置页与 keychain 安全存储落地，支持 openai/gemini/mock 切换与密钥持久化。
- 新增主进程 `src/main/provider-settings.ts` 持久化 provider 设置（keytar 写密钥、JSON 写模型/超时），IPC 增补 `config:get-provider`，preload/共享类型同步 `hasKey` 标记。
- 前端新增 `src/renderer/src/components/SettingsPanel.tsx`，App 初始化读取 provider 状态，Zustand store 增加 `loadProvider`/`setProvider` 流程，界面提示密钥存在与校验必填。
- 新测覆盖 provider 存储与 UI：`src/main/__tests__/provider-settings.test.ts`、`src/main/__tests__/ipc.test.ts`（provider 读写）、`src/renderer/src/__tests__/SettingsPanel.test.tsx` 及现有用例更新 mock。
- 测试由用户执行并验证通过。

## 2025-12-29T06:22:11Z
- 完成实施计划第 14 步：前端提供导入/导出入口与错误提示，连接主进程数据迁移能力。
- 新增组件 `src/renderer/src/components/ImportExportPanel.tsx`，支持选择 JSON/JSONL 文件导入（显示新增/跳过计数与重复覆盖说明）及导出 JSON+CSV 路径提示，状态/错误文案可见。
- `src/renderer/src/App.tsx` 挂载导入导出面板；新增测试 `src/renderer/src/__tests__/ImportExportPanel.test.tsx` 覆盖导入成功、格式不支持、后端错误与导出路径提示。
- 测试由用户执行并验证通过。

## 2025-12-27T15:14:19Z
- 完成实施计划第 13 步：渲染端新增活跃度方格视图，按最近 35 天的新增词条与复习 session 之和渲染绿色深浅，悬停显示每日详情。
- 新增组件 `src/renderer/src/components/ActivityHeatmap.tsx`，在 `App.tsx` 主界面中呈现汇总卡与方格，并复用全局活跃度数据。
- 新增测试 `src/renderer/src/__tests__/ActivityHeatmap.test.tsx` 覆盖颜色梯度与 tooltip 文案。
- 跑通命令：`npm test -- src/renderer/src/__tests__/ActivityHeatmap.test.tsx`。

## 2025-12-27T14:35:58Z
- 完成实施计划第 11 步：渲染端实现新增词条最小流程，包含 AI 生成预填、手动编辑与保存后刷新词库/活跃度。
- 新增组件 `src/renderer/src/components/AddWordForm.tsx` 与 `WordList.tsx`，`App.tsx` 切换为新增词条主界面并初始化词库与活跃度。
- 前端测试栈接入 Testing Library（jsdom 环境、全局 matcher），新增用例 `AddWordFlow.test.tsx` 覆盖空输入校验、生成填充、保存后刷新摘要。
- 依赖新增 `@testing-library/react`、`@testing-library/jest-dom`、`jsdom`。测试由用户执行并验证通过。

## 2025-12-27T15:05:07Z
- 完成实施计划第 12 步：渲染端接入复习队列 UI，支持拉取 SM-2 队列、翻面查看释义、0-5 评分并在清空队列后计入 session，提供重置与重试计数入口。
- 新增组件 `src/renderer/src/components/ReviewSession.tsx` 并在 `App.tsx` 并排展示新增与复习模块；复习流程测试 `src/renderer/src/__tests__/ReviewSession.test.tsx` 覆盖翻面、评分 IPC 参数与 session 计数，`AddWordFlow.test.tsx` 适配默认队列刷新。
- 后端 IPC 测试 `src/main/__tests__/ipc.test.ts` 补充 SM-2 `next_review_at` 日期断言确保更新后时间合法。
- 跑通命令：`npm test -- src/renderer/src/__tests__/ReviewSession.test.tsx src/renderer/src/__tests__/AddWordFlow.test.tsx src/main/__tests__/ipc.test.ts`。

## 2025-12-27T14:17:58Z
- 完成实施计划第 10 步：渲染端接入 Tailwind，设置浅色+绿色主题变量与可复用组件样式（surface-card/pill/stat-row），`App.tsx` 示例 UI 改用原子类。
- 依赖层新增 `tailwindcss`、`autoprefixer` 并切换 PostCSS 插件；保持 `tailwind.config.cjs` 色板与字体定义可复用。
- 全局 lint 报错已修复：为 AI provider 测试补充类型标注避免 `any` 访问，Mock provider 去掉 require-await，preload/IPC 返回类型收紧，storage 移除未用变量；ESLint 忽略 `vitest.config.ts` 避免 parserServices 报错。
- 测试由用户执行并验证通过。

## 2025-12-27T13:33:30Z
- 完成实施计划第 9 步：渲染端接入 Zustand 全局 store，集中管理词库列表、复习队列/session、活跃度与 provider 配置，封装 IPC 异步动作（加载/新增词条、生成内容、提交复习、完成 session 计数、导入/导出与活动刷新），支持自动生成 sessionId 与队列同步。
- 新增 `src/renderer/src/store/useAppStore.ts` 与单测 `useAppStore.test.ts`，mock `window.api` 覆盖状态更新与错误路径（空队列不重置 session、无 session 完成时抛错、导入后刷新词表、provider 设置失败不污染状态）。
- 依赖新增 `zustand` 用于状态管理。测试由用户执行并验证通过。

## 2025-12-27T01:40:12Z
- 完成实施计划第 8 步：主进程实现词库导入/导出，导入支持 JSON/JSONL 按 `word` 去重覆盖并校验无效记录计为 skipped，导出同时生成 JSON 与 CSV（输出路径随时间戳写入 `exports/` 子目录），返回词条数。
- IPC 连接导入/导出信道，渲染端可直接请求文件生成或内容导入；共享类型更新导入/导出响应字段。
- 新增单测 `src/main/__tests__/import-export.test.ts` 覆盖去重、非法输入保护与导出文件内容；`src/main/__tests__/ipc.test.ts` 补充导入/导出链路与空内容校验。
- 跑通命令：`npm test -- src/main/__tests__/import-export.test.ts src/main/__tests__/ipc.test.ts`。

## 2025-12-27T01:20:38Z
- 完成实施计划第 7 步：定义 IPC 合同与安全桥接，新增共享信道/请求响应类型（`src/shared/ipc.ts`），集中主进程 handler（`src/main/ipc/handlers.ts`）校验入参并调用存储/AI，实现复习评分时的 SM-2 更新与日志写入、活跃度接口与 provider 配置校验，预留导入/导出占位。
- 预加载暴露受控 `window.api`，渲染端类型声明更新；存储层补充 `saveWords` 支撑全量重写。
- electron.vite 添加 main/preload 别名修复 dev 构建解析；新增 IPC 集成单测覆盖入参校验、SM-2 更新与活跃度日期验证；`ai.test.ts` 消除超时未捕获警告。
- 跑通命令：`npm test`。

## 2025-12-26T15:04:00Z
- 完成实施计划第 6 步：新增主进程 AI 提供商适配层，抽象统一接口并实现 OpenAI（Responses API + JSON Schema 严格模式）、Gemini（官方 SDK generateContent）与无密钥可用的 Mock provider，包含提示词生成、输出截断与超时控制。
- 新增单测 `src/main/__tests__/ai.test.ts` 覆盖 OpenAI 请求体/超时、Gemini 正常/错误分支与 Mock 固定输出，确保生成内容可解析并受限。
- 依赖新增 `openai` 与 `@google/genai`；未跑测试由用户验证。

## 2025-12-26T12:27:02Z
- 完成实施计划第 5 步：主进程存储层实现 `FileStorage`，负责 `words.jsonl`/`reviews.jsonl`/`activity.json` 的安全读写（临时文件再替换），新增词条时补全时间/SM-2 默认值并更新活跃度，提供复习日志写入与 session 计数。
- 新增单测 `src/main/__tests__/storage.test.ts` 覆盖默认补全、JSONL 写入格式、活跃度累加与写入失败保留原文件；Vitest 配置补充 `@main` 别名。
- 跑通命令：`npm test`。

## 2025-12-26T12:04:29Z
- 完成实施计划第 4 步：在 `src/shared` 定义词条/复习日志/活跃度类型与 SM-2 常量、默认补全与校验逻辑（时间与 SM-2 字段缺省时自动补齐），实现 SM-2 更新与复习队列排序纯函数。
- 新增 Vitest 配置与单测覆盖补全、分数边界、队列排序与 EF/间隔更新；`package.json` 改为 `vitest run` 测试脚本。
- 跑通命令：`npm test -- shared`。

## 2025-12-26T11:37:02Z
- 完成实施计划第 3 步：接入 ESLint + Prettier 规范。新增 `.eslintrc.cjs` 与 `prettier.config.cjs`，覆盖 main/preload/renderer，统一单引号。
- 更新 package.json/package-lock.json，添加 ESLint/Prettier 依赖与 `lint`/`lint:fix`/`format`/`format:fix` 脚本，`npm run lint` 全量通过。
- 为 `src/main/index.ts` 的窗口加载与 `app.whenReady()` 链路补充错误处理，解决浮动 Promise 报警。
- 按新格式化规则调整渲染端入口（App.tsx/main.tsx）。

## 2025-12-26T05:57:21Z
- 完成实施计划第 2 步：接入 electron-vite + Electron + React/Vite 骨架，主/预加载/渲染入口就绪。
- 新增 electron.vite.config.ts、tsconfig.json、electron-builder.yml、资源图标，scripts 更新为 electron-vite dev/build/preview 并调用 electron-builder。
- 创建 src/main/preload/renderer 骨架（BrowserWindow + contextBridge + React UI 展示版本信息），配置路径别名与基础样式。
- 运行 npm run build 产出 dist、dist-electron 与 release 打包（未签名 mac arm64），验证构建链畅通。

## 2025-12-26T05:43:52Z
- 完成实施计划第 1 步：初始化 npm 项目，确认 Node v25.2.1 / npm v11.6.2 满足要求。
- 更新 package.json 为 ESM，添加 dev/build/lint/test 占位脚本与 engines>=18，标记 private 以避免误发。
- 新增 .gitignore（忽略 node_modules、构建产物、日志与环境变量），创建 .env.local 含 OpenAI/Google 密钥占位避免读取缺失。
- 运行 npm install 与 npm run lint（占位输出）验证依赖安装与脚本可执行。
