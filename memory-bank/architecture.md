# 架构快照（基础骨架 + 模块目录）

## 平台与框架
- 使用 Expo SDK 54 + Expo Router 6，React 19 / React Native 0.81，TypeScript 严格模式，入口为 `expo-router/entry`。

## 配置与工程基础
- package.json: 脚本（start/android/ios/web/lint/test/test:functions），依赖（Expo 栈、React Query、Zustand、SQLite、Supabase JS、Reanimated、手势、Safe Area/Screens、RN Web），devDependencies（eslint+universe 规则、jest-expo、RNTL、TS、sql.js（用于 Jest 内存 SQLite 模拟））。
- package-lock.json: 锁定上述依赖版本；deno.lock 锁定 Supabase Edge Function 测试使用的 JSR 依赖。
- app.json: 应用元数据与图标/启动图配置，启用新架构。
- tsconfig.json: 继承 expo 基础，开启 strict 与路径别名 `@/*`。
- babel.config.js: 使用 babel-preset-expo，并加载 Reanimated 插件。
- .eslintrc.js: 采用 universe/native 与 TypeScript 分析规则，配置 TS import resolver。
- jest.config.js、jest.setup.ts: 使用 jest-expo 预设，加载 RNTL 匹配器、手势与 Reanimated 测试配置；Jest 忽略 `supabase/tests`，Edge Function 测试通过 `npm run test:functions` 的 Deno 套件执行。
- expo-env.d.ts: 提供 expo-router 入口的类型声明。
- .gitignore: 忽略 node_modules、构建产物、日志等临时文件。

## 应用入口与视图
- app/_layout.tsx: SafeAreaProvider 包裹的 Router Stack 布局，默认隐藏 header。
- app/index.tsx: 首页占位视图，展示项目标题与环境就绪文案。
- app/words/new.tsx: “新增单词”页面，初始化本地 SQLite 后渲染新增表单，失败时提示数据库加载错误。
- app/__tests__/App.test.tsx: 使用 RNTL 的首页渲染快测。

## 应用目录骨架
- app/components/README.md: 约定复用型 UI 组件集合的职责，保持无业务耦合。
- app/features/README.md: 说明业务模块按子目录拆分的原则。
- app/features/words/README.md: 定义单词录入、编辑、列表与搜索的作用范围与依赖，记录新增表单与写入服务职责。
- app/features/review/README.md: 定义复习流程、卡片翻转与熟悉度标记的职责。
- app/features/heatmap/README.md: 定义活跃度聚合与热力图视图的职责。
- app/lib/README.md: 说明横切能力层的定位（API/DB/状态等）。
- app/lib/api/README.md: 约束网络与服务调用封装（Supabase、AI 代理）的职责。
- app/lib/api/aiGenerator.ts: 调用 Supabase Edge Function `ai-generator`，支持模型参数、客户端标识、超时控制与错误友好回退（提供手动编辑草稿）。
- app/lib/api/aiGenerator.test.ts: 覆盖成功生成、超时 abort 与服务端错误回退提示。
- app/lib/api/supabaseClient.ts: 读取并裁剪 `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`，校验 URL 合法性并创建 Supabase JS 客户端单例，缺参或非法时抛出早期错误。
- app/lib/api/supabaseClient.test.ts: 覆盖环境变量缺失/非法与成功路径，确保加载阶段暴露配置问题。
- app/lib/db/README.md: 约束 SQLite 初始化、表结构与 CRUD/同步队列封装的职责。
- app/lib/state/README.md: 约束 Zustand store 与 React Query 配置的职责。

## 核心类型与常量
- app/lib/constants.ts: 统一存放熟悉度枚举与默认值（familiar 默认、reviewCount=1）、复习队列批次与抽样权重、Heat Map 缓存/周起始/UTC 分桶、Supabase 环境变量键与可选 AI 模型标识。
- app/lib/types/index.ts: 定义 User/WordEntry/ReviewEvent/ActivityLog 等实体类型与草稿类型，内置构建函数校验必填字段、枚举合法性与 ISO 时间字符串（lastReviewedAt 默认 createdAt），并规范 aiMeta 结构。
- app/lib/types/types.test.ts: 覆盖类型构建器的默认值填充与非法输入防护，确保常量约束落地。

## 本地数据层（SQLite）
- app/lib/db/schema.ts: 定义 SQLite 表结构与默认值（词条熟悉度/计数默认、lastReviewedAt 与 createdAt 同步）、外键约束与索引。
- app/lib/db/database.ts: 负责打开连接、启用外键、执行建表与测试清理（涵盖同步队列），统一数据库入口。
- app/lib/db/mappers.ts: 将查询到的行数据映射为 WordEntry/ReviewEvent/ActivityLog，统一 snake_case 与实体字段。
- app/lib/db/wordRepository.ts: 封装词条增删改查，保证默认值与时间戳更新一致。
- app/lib/db/reviewEventRepository.ts: 记录复习事件并按词条查询，级联删除依赖外键。
- app/lib/db/activityLogRepository.ts: 提供活跃度 upsert/累加、查询与删除接口。
- app/lib/db/syncQueue/constants.ts: 定义同步队列实体类型、操作类型与指数退避时间常量。
- app/lib/db/syncQueue/queueRepository.ts: 维护词条/复习事件的同步队列入队（客户端更新时间去重取最新）、到期拉取、成功删除、失败退避与服务端时间优先的冲突决策。
- app/lib/db/syncQueue/syncQueue.test.ts: 模拟离线写入、重试与冲突分支，验证去重、退避与删除行为。
- app/lib/db/index.ts: 暴露持久化层统一出口。
- app/lib/db/db.test.ts: 基于内存 SQLite 验证建表、CRUD 与外键级联；依赖 `__mocks__/expo-sqlite.ts`（sql.js asm 驱动）。

## 状态管理与数据获取
- app/lib/state/appStore.ts: 基于 Zustand vanilla store 维护词条 Map、复习队列与按日活动计数，提供去重入队/出队、增删改查、计数累加与重置等动作，并兼容 React 侧选择器。
- app/lib/state/queryKeys.ts: 统一定义词条/活动日志/复习队列等 React Query key，避免跨模块硬编码。
- app/lib/state/queryClient.ts: 创建携带默认重试、staleTime、gcTime 与窗口焦点刷新策略的 QueryClient，并暴露默认配置查询接口。
- app/lib/state/queries.ts: 封装 SQLite 数据源的词条/活动日志 query 配置与预取辅助，便于在业务层复用。
- app/lib/state/index.ts: state 层出口，集中导出 store 与 Query 工具。

## Supabase Edge Functions
- supabase/functions/ai-generator/index.ts: Deno.serve 入口，挂载 AI 生成代理 handler。
- supabase/functions/ai-generator/handler.ts: 统一处理 CORS、POST/JSON 校验、敏感词过滤、滑动窗口限流、超时保护与模型路由，返回固定 JSON（reading/meaningZh/exampleJa/model）。
- supabase/functions/ai-generator/modelProviders.ts: 支持 GPT-4o/3.5、Gemini 2.5 Flash-Lite 的调用与返回解析，含模型别名、配置错误与上游错误封装。
- supabase/functions/ai-generator/filters.ts: 轻量敏感词匹配工具。
- supabase/functions/ai-generator/rateLimiter.ts: 双窗口计数限流实现，按客户端键统计。
- supabase/tests/ai-generator.spec.ts: Deno 原生测试，覆盖成功生成、敏感词拒绝、限流命中与超时分支；`npm run test:functions` 指向该套件。

## 业务模块：词库新增
- app/features/words/components/AddWordForm.tsx: 新增单词表单，含词面输入、AI 生成触发、读音/释义/例句编辑、熟悉度选择与保存按钮，可注入生成器避免测试时加载 Supabase 环境。
- app/features/words/services/createWord.ts: 写入词条的服务封装，生成唯一 ID、调用 SQLite 插入并默认熟悉度/计数/时间戳、累加当日 `activity_log.addCount`、入同步队列，并同步更新 Zustand store。
- app/features/words/__tests__/AddWordForm.test.tsx: RNTL 场景测试，覆盖空内容校验、AI 填充与保存后词条/活跃度/同步队列写入。

## 资产
- assets/images/*: 应用图标、启动图、favicon 占位资源。

## 状态
- 当前完成实施计划第 10 步（“新增单词”页面与流程）：新增表单、写入服务与路由，保存时写入 SQLite、累加活跃度并入同步队列，RNTL 场景测试通过；上一阶段 AI 封装保持独立 Deno 测试。***
