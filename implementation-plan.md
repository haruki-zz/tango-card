# 实施计划（核心功能优先）

## 核心阶段
1. 安装依赖并验证工具链  
   - 执行依赖安装（Expo、React Native、Supabase、测试框架），确保使用 pnpm/npm 一致。  
   - 测试：运行 `npm run lint` 与 `npm test`，确认基线环境可编译且现有测试（若有）通过。
2. 建立模块化目录骨架  
   - 创建 `app/features/words`、`app/features/review`、`app/features/heatmap`、`app/lib/api`、`app/lib/db`、`app/lib/state`、`app/components` 等目录，确保多文件分层。  
   - 测试：执行 `ls` 确认目录存在；运行 `npm run lint` 确认新增占位文件（如 README 占位）未触发 lint 错误。
3. 定义核心类型与常量  
   - 在 `app/lib/types` 定义 `User`、`WordEntry`、`ReviewEvent`、`ActivityLog` 结构，集中通用枚举与业务常量于 `app/lib/constants.ts`。  
   - 测试：编写 Jest 类型守卫/工厂函数单测，验证字段必填、枚举取值受限；运行 `npm test`。
4. 搭建本地 SQLite 持久化层  
   - 在 `app/lib/db` 实现 SQLite 初始化、表创建与基础 CRUD（词条、复习事件、活动日志），封装为独立模块。  
   - 测试：使用 SQLite 内存数据库的单测验证建表、插入、查询、更新、删除全链路；运行 `npm test`.
5. 建立状态管理与数据获取框架  
   - 在 `app/lib/state` 配置 Zustand store，负责词库列表、当前复习队列、活动计数；结合 React Query 做数据获取与缓存策略。  
   - 测试：编写 store 单测验证增删改查、复习队列入队/出队、活动计数累加的状态变更。
6. 配置 Supabase SDK 与环境校验  
   - 在 `app/lib/api/supabaseClient` 初始化 Supabase 客户端，读取 `.env` 并做必需变量校验，避免运行时缺参。  
   - 测试：编写配置单测，模拟缺失/错误环境变量场景，期待抛出明确错误；运行 `npm test`。
7. 设计离线队列与同步策略  
   - 在 `app/lib/db/syncQueue` 维护未同步的词条与复习事件，提供入队、重试、冲突处理（服务端时间优先）的接口。  
   - 测试：单测模拟离线写入、恢复网络后的批量同步流程，验证失败重试与重复提交去重逻辑。
8. 实现 AI 生成 Edge Function 代理接口  
   - 在 `supabase/functions` 编写 AI 代理函数：接收词面，调用 OpenAI，输出 JSON（reading, meaningZh, exampleJa），包含速率限制与敏感词过滤。  
   - 测试：Deno/Vitest 单测使用 mock OpenAI，验证成功返回格式、超时/敏感词分支、速率限制命中时的错误响应。
9. 封装客户端 AI 调用与回退  
   - 在 `app/lib/api/aiGenerator` 封装对 Edge Function 的调用，超时/失败时允许手动输入回退。  
   - 测试：单测模拟成功、超时、错误返回，验证回退分支能启用手动编辑并提示用户。
10. 完成“新增单词”页面与流程  
    - 在 `app/features/words` 构建新增页面：词面输入、AI 生成按钮、可编辑结果、保存按钮；保存时写入 SQLite 与 `ActivityLog`，并入同步队列。  
    - 测试：React Native Testing Library（RNTL）组件测试，覆盖输入校验、AI 调用触发、编辑保存后本地数据与队列记录存在；运行 `npm test`。
11. 构建卡片组件与翻转动画  
    - 在 `app/components` 实现可复用的卡片组件，正反面展示（词面+假名 / 释义+例句），使用 Reanimated 做翻转与滑动切卡动画。  
    - 测试：RNTL + jest-reanimated 测试卡片正反面切换、翻转动画触发、滑动切换回调触发。
12. 组装复习队列与熟悉度更新逻辑  
    - 在 `app/features/review` 生成复习列表（全部/未熟/随机），卡片翻面后提供 `熟悉`/`不熟` 按钮，更新 `WordEntry.familiarity`、`reviewCount`、`lastReviewedAt`，记录 `ReviewEvent` 与 `ActivityLog`。  
    - 测试：store 与组件集成测试，模拟一轮复习操作，断言字段更新、事件写入、队列前进/重置行为正确。
13. 实现复习导航与进度反馈  
    - 加入复习进度条、跳过/重置按钮，处理空队列与网络不可用提示。  
    - 测试：RNTL 场景测试验证跳过/重置后的队列状态、进度显示、空状态渲染。
14. 构建 Heat Map 数据聚合与缓存  
    - 在 `app/features/heatmap` 汇总 `ActivityLog` 为按日计数，提供周/月切换与本地缓存，支持离线查看。  
    - 测试：纯函数单测验证聚合结果、周/月切换逻辑、缓存读写与过期策略。
15. 实现 Heat Map UI 与互动  
    - 使用轻量 SVG 渲染方格，颜色梯度基于每日计数，点击某日展示新增/复习细节。  
    - 测试：RNTL 组件测试验证颜色强度随计数变化、点击弹出详情、切换周/月时数据刷新。

## 后续增强阶段
16. 搜索与筛选  
    - 在词库列表添加搜索框、熟悉度与时间筛选，复用 React Query 过滤。  
    - 测试：RNTL 测试输入关键字/切换筛选条件后，列表结果与空态提示正确。
17. 账号与同步整合  
    - 接入 Supabase Auth（匿名到登录合并），同步本地 SQLite 与云端数据，处理冲突提示。  
    - 测试：端到端或集成测试覆盖匿名写入→登录→数据合并→同步成功/失败重试路径。
18. 观测与更新机制  
    - 集成 Sentry 监控、Expo OTA 更新配置，提供错误上报与版本提示。  
    - 测试：在调试环境触发模拟错误，验证 Sentry 捕获；运行 OTA 检查流程，确认版本拉取成功。
19. 性能与离线体验优化  
    - 优化大列表渲染（虚拟化）、AI 调用超时策略、离线模式提示与重试队列性能。  
    - 测试：性能基准脚本或手动测量大列表滚动帧率；单测验证超时重试与离线提示展示。
20. E2E 关键路径回归  
    - 使用 Detox 覆盖“新增单词（含 AI 回退）→ 复习标记 → Heat Map 更新”全链路。  
    - 测试：执行 Detox 测试套件，确保关键路径无回归。
