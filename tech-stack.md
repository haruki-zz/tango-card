# 技术栈（最简单且健壮）

## 指导原则
- 移动优先、离线可用、尽量托管化，减少自建运维。
- 单一语言栈（TypeScript）贯穿前后端，降低心智负担。

## 客户端
- React Native + Expo（托管工作流）：快速迭代，多平台一致的 UI/动画（卡片翻转、滑动）。
- Expo SQLite：本地缓存词库与待同步事件，保障离线录入/复习。
- 状态管理：Zustand（轻量）+ React Query（数据获取/缓存/重试）。
- UI：Expo Router + 内置动画库（Reanimated）渲染卡片翻转；Heat Map 采用轻量 SVG 组件。
- Crash/性能：Expo 内建 Updates/OTA，Sentry for RN 监控。

## 后端与 API
- Supabase（Postgres + Auth + Edge Functions + Storage）：
  - Postgres 存储 `users`, `word_entries`, `review_events`, `activity_log`。
  - Auth: 邮箱/社交登录；匿名用户允许本地使用，登录后数据合并。
  - Row Level Security 保障数据隔离。
  - Edge Functions（TypeScript/Deno）封装 AI 代理、权限校验、速率限制。
- HTTP/GraphQL 选型：Supabase JS SDK（直接走 PostgREST + Realtime），减少自建 API。

## AI 接入
- OpenAI GPT-4o / 3.5-turbo 经 Supabase Edge Function 代理：
  - 输入：词面；输出 JSON（reading, meaningZh, exampleJa）。
  - 限流与重试：Edge Function 内做 token 级限流与熔断，客户端只调用自家域名。
  - 安全：过滤敏感词，失败回退到手动编辑。

## 数据与同步
- 本地 SQLite 队列化变更（新增词、复习事件）；网络恢复后通过 Supabase SDK 批量同步。
- 时间字段一律 ISO 字符串，服务端作为真源；客户端合并策略：服务端时间优先，客户端冲突提示用户。
- Heat Map 数据：按日聚合 `activity_log`（新增 + 复习），客户端可做缓存。

## 观测与运维
- 监控：Sentry（前后端）+ Supabase 自带日志。
- 构建/发布：Expo EAS（自动签名/CI），环境变量通过 Expo Secrets/Supabase Config 注入。
- 备份：Supabase 数据库每日自动备份；Edge Function 代码在 git 托管。

## 测试与质量
- 客户端：Jest + React Native Testing Library（组件/逻辑），E2E 用 Detox 小范围覆盖关键流（录入/复习/同步）。
- 边界：离线模式、AI 调用失败回退、RLS 权限校验。
