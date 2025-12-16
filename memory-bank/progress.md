# 进度记录

## 实施计划第 1 步（工具链与基础骨架）
- 初始化 Expo Router + TypeScript 项目骨架，配置 app.json、tsconfig、babel、eslint、jest，添加基础首页视图与占位测试。
- 引入核心依赖：Expo 54、React 19、RN 0.81、React Query、Zustand、SQLite、Supabase JS、Reanimated、手势/Safe Area/Screens 及 RNTL/Jest 工具链。
- 复制基础图标与启动图到 assets/images，确保 Expo 配置可用。
- 本地验证：`npm run lint`、`npm test` 均通过。

## 实施计划第 2 步（建立模块化目录骨架）
- 创建业务与基础能力骨架目录：`app/features/words`、`app/features/review`、`app/features/heatmap`、`app/lib/api`、`app/lib/db`、`app/lib/state`、`app/components`，并在 `app/features`、`app/lib` 及各子目录添加 README 说明职责。
- 更新 `CLAUDE.md` 反映新的目录层级与模块边界。
- 本地验证：`npm run lint` 通过，确保新增占位文件未引入 lint 问题。***

## 实施计划第 3 步（定义核心类型与常量）
- 新增 `app/lib/constants.ts` 汇总熟悉度默认值（familiar）、reviewCount 默认 1、复习批次大小 30、2:1 抽样权重、Heat Map 缓存 TTL、周起始与 UTC 分桶、Supabase 环境变量键与可选 AI 模型标识。
- 新增 `app/lib/types/index.ts` 定义 User/WordEntry/ReviewEvent/ActivityLog 等核心实体与草稿类型，并提供构建函数校验必填字段、枚举合法性与 ISO 时间字符串（lastReviewedAt 默认 createdAt）。
- 新增 `app/lib/types/types.test.ts` 覆盖默认值落地、非法枚举与负计数的防护，确保类型构建器行为稳定。
- 本地验证：`npm test` 通过。***

## 实施计划第 4 步（搭建本地 SQLite 持久化层）
- 在 `app/lib/db` 实现 SQLite 初始化与表结构：开启外键约束，创建 `word_entries`、`review_events`（级联删除）与 `activity_log`，表默认值覆盖熟悉度 familiar、reviewCount=1、lastReviewedAt 与 createdAt 同步。
- 新增 CRUD 封装：`wordRepository` 管理词条增删改查，`reviewEventRepository` 记录复习事件，`activityLogRepository` 负责活跃度 upsert/累加，`database.ts` 统一连接初始化/清理，`mappers.ts` 统一行数据映射。
- 为单测引入 `__mocks__/expo-sqlite.ts`（基于 sql.js asm 内存库）并编写 `app/lib/db/db.test.ts` 覆盖建表、插入、查询、更新、删除与外键级联。
- 本地验证：`npm test` 通过。***

## 实施计划第 5 步（建立状态管理与数据获取框架）
- 引入 `app/lib/state/appStore.ts` 的 Zustand store，集中维护词条 Map、复习队列与按日期的活动计数；提供增删改查、队列去重/入队/出队、活动累加与重置等动作。
- 配置 React Query 基础设施：`queryKeys.ts` 统一 key 生成，`queryClient.ts` 暴露带默认重试/缓存策略的创建器，`queries.ts` 封装词条与活动日志的预取 query。
- 新增导出入口 `app/lib/state/index.ts`，便于业务层复用 store 与 Query 配置。
- 单测覆盖 store 状态变更与 Query Client 默认项：`npm test -- app/lib/state` 通过；用户已验证，暂不推进第 6 步。***

## 实施计划第 6 步（配置 Supabase SDK 与环境校验）
- 新增 `app/lib/api/supabaseClient.ts`：读取并裁剪 `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`，校验 URL 合法性，创建 Supabase JS 客户端单例，缺参或非法时抛出明确错误。
- 编写 `app/lib/api/supabaseClient.test.ts` 覆盖完整配置与缺参/非法 URL 分支，确保加载阶段即可暴露环境问题。
- 本地验证：`npm test -- app/lib/api` 通过；用户已确认第 6 步完成，待指令再启动第 7 步。***

## 实施计划第 7 步（设计离线队列与同步策略）
- 增加同步队列表结构与常量：`app/lib/db/schema.ts` 引入 `sync_queue` 表，约束 `entity_type`/`operation` 枚举、客户端更新时间与退避字段；`syncQueue/constants.ts` 统一实体/操作枚举与退避参数。
- 编写队列仓储：`app/lib/db/syncQueue/queueRepository.ts` 提供词条与复习事件入队（同一实体按客户端更新时间去重取最新）、到期查询、成功删除、失败指数退避（1s 起步，封顶 5 分钟）、冲突处理（服务端时间优先，否则立即重试），并对 payload 进行构建校验。
- 补充 README/导出：`app/lib/db/README.md` 说明同步队列职责，`app/lib/db/index.ts` 导出接口；清理逻辑涵盖 `sync_queue`。
- 单测：`npm test -- app/lib/db/syncQueue` 通过，覆盖重复入队去重、失败退避、冲突决策、复习事件入队与成功删除流程。***

## 实施计划第 8 步（实现 AI 生成 Edge Function 代理接口）
- 新增 Edge Function `supabase/functions/ai-generator`：`handler.ts` 负责 CORS、JSON 校验、敏感词过滤、滑动窗口限流、超时保护与模型路由；`modelProviders.ts` 封装 GPT-4o/3.5 与 Gemini Flash-Lite 调用与 JSON 解析；`filters.ts`、`rateLimiter.ts` 拆分敏感词与限流；`index.ts` 绑定 Deno.serve。
- 编写 Deno 单测 `supabase/tests/ai-generator.spec.ts` 覆盖成功返回、敏感词拒绝、限流与超时分支，新增 `deno.lock` 锁定 JSR 依赖；`npm run test:functions` 路由至该测试，命令本地通过。
- 目录文档 `CLAUDE.md` 已同步 supabase Edge Function 的位置与职责说明。***

## 实施计划第 9 步（封装客户端 AI 调用与回退）
- 在 `app/lib/api/aiGenerator.ts` 封装 Edge Function `ai-generator` 调用，支持模型参数、客户端 ID 头、外部 AbortSignal 与超时控制，统一错误码映射并回退到手动可编辑草稿。
- 新增单测 `app/lib/api/aiGenerator.test.ts` 覆盖成功路径、超时 abort 与服务端错误回退提示；`jest.config.js` 忽略 `supabase/tests`，确保 Deno 测试由 `npm run test:functions` 独立执行。
- 更新 `app/lib/api/README.md` 与 `CLAUDE.md` 记录新模块职责与目录；`npm test` 通过。***
