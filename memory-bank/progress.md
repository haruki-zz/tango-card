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
