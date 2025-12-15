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
