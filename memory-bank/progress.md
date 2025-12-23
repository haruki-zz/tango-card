## 初始化骨架
- 设立 Electron + Vite + React + TypeScript 基础工程，脚本覆盖 dev/build/test/lint/e2e 占位。
- 配置主/预加载/渲染的 TypeScript 方案与 Vite 构建输出目录，启用 contextIsolation、禁用 nodeIntegration。
- 构建验证通过（npm run build），渲染层展示占位 UI 并可通过 preload ping。

## 配置质量工具
- 安装并落地 ESLint + Prettier（eslint.config.cjs、prettier.config.cjs），更新 npm 脚本启用 lint/format。
- 添加 Vitest 配置与占位用例（vitest.config.ts、tests/smoke.test.ts），`npm run test` 通过。
- 预置 Playwright 配置与空场景（playwright.config.ts、e2e/smoke.spec.ts），完成浏览器依赖安装并使 `npm run e2e` 通过。
- 调整 .gitignore 增加 coverage/playwright-report/test-results，渲染 App 使用惰性初始化读取 preload ping 以满足新 lint 规则。

## 主/渲染进程边界
- 建立 shared 类型与通道（src/shared/apiTypes.ts、src/shared/ipcChannels.ts），约束 ai/db/settings/files 白名单接口。
- 预加载通过 createPreloadApi（src/preload/createApi.ts）包装 ipcRenderer.invoke，暴露 window.api，渲染 env.d.ts 引用 shared 类型。
- 主进程注册模拟 IPC handler（src/main/ipcHandlers.ts），main.ts 启动时加载，提供可预测的 mock 数据（AI 生成、队列、复习反馈、设置读写、导入导出）。
- 增补 ipc 边界单测（tests/ipc-boundary.test.ts）验证 window.api 方法可用；`npm run test` 通过。

## SQLite 数据层
- 引入 better-sqlite3 + Drizzle，新增 src/main/db/schema.ts 定义 words/review_events/daily_activity/settings 表与 SRS 默认值常量。
- 新增 src/main/db/database.ts 封装数据库初始化，启用外键、建表 DDL、种子 settings 单行，数据库路径优先 TANGO_CARD_DB_PATH，其次 Electron userData，最后 cwd。
- main.ts 启动时初始化数据库，确保表就绪后再注册 IPC。
- 新增 tests/db-schema.test.ts 覆盖建表默认值、枚举约束与 settings 默认行；`npm run test` 通过。

## AI 调用模块占位
- 新增主进程 AI 客户端（src/main/ai/aiClient.ts），支持 Gemini Flash 2.5 Lite / GPT-4o / GPT-4.1-mini，校验空词与缺失 API Key，区分 HTTP 错误、请求异常与响应格式异常，返回结构化 ok/error。
- IPC 层改为注入式 AI 客户端（registerIpcHandlers 支持传入 aiClient），settings 更新时同步刷新客户端配置，`ai:generateWordData` 调用真实客户端。
- 添加单测覆盖 AI 成功、缺 Key、HTTP 429 失败（tests/ai-client.test.ts）与改造后的 IPC 通路 stub（tests/ipc-boundary.test.ts）；`npm test` 通过。

## 新增单词表单（核心流）
- 扩展 IPC/类型：新增 `db:createWord` 通道与 CreateWordInput 类型，预加载映射 createWord。
- 数据层：新增 wordService 校验必填字段、写入 words 表并自增 daily_activity.words_added_count，默认 SRS 字段取常量。
- 渲染层：实现新增单词页面（AI 生成→手动微调→保存后锁定→重置继续），例句列表与预览组件拆分，视觉样式更新以支撑双列布局。
- 测试：补充 React Testing Library 用例覆盖生成失败提示、成功填充、保存锁定与重置；wordService 单测验证写库与每日计数；IPC 边界单测改为使用内存数据库。`npm test` 已通过。

## 单词卡片组件（双面）
- 新增复习用卡片组件（src/renderer/features/review/ReviewWordCard.tsx，index.ts 导出），正面展示单词+假名，背面展示释义与例句，点击或空格翻转，空例句时提供提示。
- 全局样式补充卡片 3D 翻转、提示与排版样式（src/renderer/index.css）。
- 添加 RTL+Vitest 覆盖点击与空格翻转、字段渲染（tests/review-word-card.test.tsx），测试通过。***

## 复习队列生成
- 主进程新增复习队列服务（src/main/db/reviewQueueService.ts），按到期时间升序取已到期卡片，缺口随机补充新卡，整体上限 30。
- dbGetTodayQueue IPC 由真实队列生成替代原先 mock，wordService 暴露 mapWordRow 供复用。
- 新增复习队列单测（tests/review-queue.test.ts）覆盖排序、补足与上限截断；ipc 边界用例先写入真实词条再拉取队列，保证通路验证。
- 测试：npm test（通过）。***

## 复习交互 + SRS 更新
- 新增 SRS 调度与复习写库服务（src/main/db/reviewService.ts），基于 SM-2 调整间隔/易度，记录 review_events、更新 words SRS 字段与 daily_activity.reviews_done_count。
- 抽出 UTC 日起点工具（src/main/db/timeUtils.ts），wordService/daily activity 复用。
- IPC `db:answerReview` 接入真实 SRS 更新；AnswerReviewResult 类型补充 interval/repetitions/easeFactor/reviewedAt。
- 渲染层新增 ReviewSession（src/renderer/features/review/ReviewSession.tsx），加载队列、翻转卡片、快捷键 A/H/G/E 评分，跳过即记 Easy，展示进度/摘要；样式更新在 src/renderer/index.css，并在 App 中串联新增与复习区块。
- 测试：新增 SRS 写库单测（tests/review-service.test.ts）与复习交互用例（tests/review-session.test.tsx）；ipc 边界用例补充返回字段断言。用户已验证 npm test 通过。***

## Heat Map 数据生成与展示
- 数据层新增活跃度聚合（src/main/db/activityService.ts），按日读取 daily_activity，向前 12 个月对齐周起点并填充空日；timeUtils 补充 DAY_SECONDS 与周起点计算。
- IPC/预加载扩展 `db:getHeatmapActivity` 通道与 HeatmapActivityRange 类型，渲染可通过 window.api.db.getHeatmapActivity 取数据。
- 渲染新增 Heat Map 视图（src/renderer/features/heatmap/ActivityHeatMap.tsx 与 heatmapUtils.ts），支持新增/复习切换、档位图例、近 12 个月网格；index.css 增加样式；App 串联展示。
- 修复 dev 环境 preload 未编译导致通道缺失：dev 脚本加入 preload watch 编译，main.ts 始终加载 dist/preload/index.js，确保 window.api 包含新通道。
- 测试：新增聚合与档位单测（tests/activity-service.test.ts、tests/heatmap-utils.test.ts），ipc 边界用例覆盖热力图通道；npm test 通过。***

## 设置与配置存储
- 新增 settings 服务（src/main/db/settingsService.ts），支持读取/更新 settings 单行表，规范化模型、批次大小、主题与 API Key 为空值处理。
- IPC 层改为异步初始化数据库后注册 handler，settings 通道落地 SQLite 并在模型/API Key 变化时同步 AiClient；main.ts 等待注册完成再建窗。
- 渲染层新增设置视图（src/renderer/features/settings/SettingsPanel.tsx，index 导出），可加载/保存 API Key、模型、批次大小、主题，补充 select/布局样式并挂载到 App。
- 测试：新增 settings 服务与设置页的单测（tests/settings-service.test.ts、tests/settings-panel.test.tsx），ipc 边界测试更新为 await 异步注册并覆盖 settings 通道。用户已验证测试通过。***
