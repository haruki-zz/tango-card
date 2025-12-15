# Repository Guidelines

## Always(重要提示)
- 写任何代码前必须完整阅读 `prompts/@system-prompts.md`，牢记并严格遵守定义的 role 和行为规范。
- 写任何代码前必须完整阅读 `prompts/@coding-prompts.md`，严格遵守定义的编程规范。
- 写任何代码前必须完整阅读 `memory-bank/@architecture.md`（包含完整数据库结构）。
- 写任何代码前必须完整阅读 `memory-bank/@design-document.md`。
- 写任何代码时必须牢记 **模块化（多文件）** 规则，禁止单体巨文件（monolith）。
- 每完成一个重大功能或里程碑后，必须更新 `memory-bank/@architecture.md`。

## Project Structure & Modules
- 根目录文档：`design-document.md`（产品需求），`tech-stack.md`（技术选型），`AGENTS.md`（本指南）。
- 预期客户端：`app/`（Expo React Native 源码），`app/components/`（UI），`app/features/`（业务模块：词库、复习、热力图），`app/lib/`（API/缓存）。
- 预期服务端：`supabase/functions/`（Edge Functions：AI 代理、鉴权、速率限制），`supabase/migrations/`（数据库表/策略），`supabase/tests/`（函数单测）。
- 资产与配置：`assets/`（图标/字体），`config/`（环境样例，如 `.env.example`），`docs/`（扩展设计/流程）。

## Build, Test, and Development Commands
- `npm install` / `pnpm install`：安装依赖（客户端与 Edge Functions 共用 TypeScript 生态）。
- `npm run start`：启动 Expo 开发服务器（默认移动预览）。
- `npm run lint`：运行 ESLint + TypeScript 检查。
- `npm test`：运行客户端单测（Jest + React Native Testing Library）。
- `npm run test:functions`：运行 Edge Functions 单测（Deno/Vitest 视具体脚手架）。
- `npm run format`：Prettier 格式化（如配置）。

## Coding Style & Naming
- 语言：TypeScript；缩进 2 空格；尽量保持纯 ASCII。
- 命名：组件/文件用 PascalCase (`WordCard.tsx`)，hooks 与工具用 camelCase (`useHeatmapData.ts`)，表与列名 snake_case。
- 约定：业务常量集中 `app/lib/constants.ts`；API 封装统一 `app/lib/api/`。
- Lint/格式：ESLint + Prettier（保持默认规则，严禁忽略无故 disable）。

## Testing Guidelines
- 覆盖关键流：单词新增→AI 生成→保存→复习标记→热力图更新；离线回放与同步。
- 命名：测试文件以 `.test.tsx?` 结尾；Edge Functions 以 `.spec.ts`。
- 运行：先本地 `npm test`，如改动函数逻辑再跑 `npm run test:functions`；必要时附上失败复现步骤。

## Commit & Pull Request Guidelines
- 提交信息：短句式英文/中文均可，前缀动词，如 `add card flip animation`、`fix offline sync queue`。
- 每个 PR 描述需包含：变更摘要、测试结果（命令 + 状态）、风险与回滚方案；涉及 UI 变更附简图/录屏。
- 保持单一责任：前端与 Edge Functions 变更分开 PR；数据库迁移独立 PR 并附迁移说明。

## Security & Configuration
- 环境变量：使用 `.env.local`（客户端）、`supabase/.env`（函数）；不要提交秘钥，提供 `.env.example`。
- 数据安全：Supabase RLS 必须开启；Edge Functions 内做输入校验与速率限制；AI 代理过滤敏感词。
