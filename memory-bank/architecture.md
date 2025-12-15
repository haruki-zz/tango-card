# 架构快照（基础骨架 + 模块目录）

## 平台与框架
- 使用 Expo SDK 54 + Expo Router 6，React 19 / React Native 0.81，TypeScript 严格模式，入口为 `expo-router/entry`。

## 配置与工程基础
- package.json: 脚本（start/android/ios/web/lint/test），依赖（Expo 栈、React Query、Zustand、SQLite、Supabase JS、Reanimated、手势、Safe Area/Screens、RN Web），devDependencies（eslint+universe 规则、jest-expo、RNTL、TS、sql.js（用于 Jest 内存 SQLite 模拟））。
- package-lock.json: 锁定上述依赖版本。
- app.json: 应用元数据与图标/启动图配置，启用新架构。
- tsconfig.json: 继承 expo 基础，开启 strict 与路径别名 `@/*`。
- babel.config.js: 使用 babel-preset-expo，并加载 Reanimated 插件。
- .eslintrc.js: 采用 universe/native 与 TypeScript 分析规则，配置 TS import resolver。
- jest.config.js、jest.setup.ts: 使用 jest-expo 预设，加载 RNTL 匹配器、手势与 Reanimated 测试配置。
- expo-env.d.ts: 提供 expo-router 入口的类型声明。
- .gitignore: 忽略 node_modules、构建产物、日志等临时文件。

## 应用入口与视图
- app/_layout.tsx: SafeAreaProvider 包裹的 Router Stack 布局，默认隐藏 header。
- app/index.tsx: 首页占位视图，展示项目标题与环境就绪文案。
- app/__tests__/App.test.tsx: 使用 RNTL 的首页渲染快测。

## 应用目录骨架
- app/components/README.md: 约定复用型 UI 组件集合的职责，保持无业务耦合。
- app/features/README.md: 说明业务模块按子目录拆分的原则。
- app/features/words/README.md: 定义单词录入、编辑、列表与搜索的作用范围与依赖。
- app/features/review/README.md: 定义复习流程、卡片翻转与熟悉度标记的职责。
- app/features/heatmap/README.md: 定义活跃度聚合与热力图视图的职责。
- app/lib/README.md: 说明横切能力层的定位（API/DB/状态等）。
- app/lib/api/README.md: 约束网络与服务调用封装（Supabase、AI 代理）的职责。
- app/lib/db/README.md: 约束 SQLite 初始化、表结构与 CRUD/同步队列封装的职责。
- app/lib/state/README.md: 约束 Zustand store 与 React Query 配置的职责。

## 核心类型与常量
- app/lib/constants.ts: 统一存放熟悉度枚举与默认值（familiar 默认、reviewCount=1）、复习队列批次与抽样权重、Heat Map 缓存/周起始/UTC 分桶、Supabase 环境变量键与可选 AI 模型标识。
- app/lib/types/index.ts: 定义 User/WordEntry/ReviewEvent/ActivityLog 等实体类型与草稿类型，内置构建函数校验必填字段、枚举合法性与 ISO 时间字符串（lastReviewedAt 默认 createdAt），并规范 aiMeta 结构。
- app/lib/types/types.test.ts: 覆盖类型构建器的默认值填充与非法输入防护，确保常量约束落地。

## 本地数据层（SQLite）
- app/lib/db/schema.ts: 定义 SQLite 表结构与默认值（词条熟悉度/计数默认、lastReviewedAt 与 createdAt 同步）、外键约束与索引。
- app/lib/db/database.ts: 负责打开连接、启用外键、执行建表与测试清理，统一数据库入口。
- app/lib/db/mappers.ts: 将查询到的行数据映射为 WordEntry/ReviewEvent/ActivityLog，统一 snake_case 与实体字段。
- app/lib/db/wordRepository.ts: 封装词条增删改查，保证默认值与时间戳更新一致。
- app/lib/db/reviewEventRepository.ts: 记录复习事件并按词条查询，级联删除依赖外键。
- app/lib/db/activityLogRepository.ts: 提供活跃度 upsert/累加、查询与删除接口。
- app/lib/db/index.ts: 暴露持久化层统一出口。
- app/lib/db/db.test.ts: 基于内存 SQLite 验证建表、CRUD 与外键级联；依赖 `__mocks__/expo-sqlite.ts`（sql.js asm 驱动）。

## 状态管理与数据获取
- app/lib/state/appStore.ts: 基于 Zustand vanilla store 维护词条 Map、复习队列与按日活动计数，提供去重入队/出队、增删改查、计数累加与重置等动作，并兼容 React 侧选择器。
- app/lib/state/queryKeys.ts: 统一定义词条/活动日志/复习队列等 React Query key，避免跨模块硬编码。
- app/lib/state/queryClient.ts: 创建携带默认重试、staleTime、gcTime 与窗口焦点刷新策略的 QueryClient，并暴露默认配置查询接口。
- app/lib/state/queries.ts: 封装 SQLite 数据源的词条/活动日志 query 配置与预取辅助，便于在业务层复用。
- app/lib/state/index.ts: state 层出口，集中导出 store 与 Query 工具。

## 资产
- assets/images/*: 应用图标、启动图、favicon 占位资源。

## 状态
- 当前完成实施计划第 5 步（建立状态管理与数据获取框架）：在 SQLite CRUD 之上引入 Zustand store 管理词库、复习队列与活动计数，配套 React Query key/client 与查询预设，并用针对性的单测校验核心状态变更逻辑；用户已确认测试通过，等待指令再开始第 6 步（Supabase SDK 配置）。***
