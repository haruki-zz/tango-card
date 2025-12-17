# 目录结构与职责速览

```
tango-card/
├ app/                         # Expo Router 页面、业务模块与测试
│ ├ _layout.tsx                # SafeArea + Router Stack 布局入口
│ ├ index.tsx                  # 首页占位视图
│ ├ words/
│ │ └ new.tsx                  # “新增单词”页面，加载本地数据库后渲染表单
│ ├ components/                # 复用 UI 组件集合
│ │ ├ README.md
│ │ ├ WordCard.tsx             # 正反面翻转的记忆卡片组件，支持滑动切卡回调
│ │ └ __tests__/WordCard.test.tsx# 卡片翻转动画与滑动回调的 RNTL 测试
│ ├ features/                  # 业务模块（词库/复习/热力图）
│ │ ├ words/                   # 单词录入、编辑、列表与搜索
│ │ │ ├ README.md
│ │ │ ├ components/AddWordForm.tsx    # 新增单词表单，支持 AI 生成、熟悉度选择与保存
│ │ │ ├ services/createWord.ts        # 写入 SQLite、累加活跃度、入同步队列的封装
│ │ │ └ __tests__/AddWordForm.test.tsx# 新增表单的 RNTL 场景测试
│ │ ├ review/                  # 复习流程、卡片翻转与标记
│ │ │ ├ README.md
│ │ │ ├ components/
│ │ │ │ └ ReviewSession.tsx    # 挂载 WordCard 的复习会话组件，支持熟悉/不熟/跳过与重置
│ │ │ ├ services/
│ │ │ │ ├ reviewActions.ts     # 统一处理熟悉度更新、ReviewEvent 写入、活跃度累加与同步入队
│ │ │ │ └ reviewQueue.ts       # 2:1 权重抽样复习队列与队列准备逻辑
│ │ │ └ __tests__/
│ │ │   ├ ReviewSession.test.tsx # 复习流程与重置行为的集成测试
│ │ │   └ reviewQueue.test.ts    # 队列抽样比例与互补逻辑测试
│ │ └ heatmap/                 # 活跃度聚合与热力图视图
│ ├ lib/                       # 横切能力层（API/DB/状态/类型）
│ │ ├ api/                     # Supabase/AI 等服务封装
│ │ │ ├ README.md
│ │ │ ├ aiGenerator.test.ts
│ │ │ ├ aiGenerator.ts
│ │ │ ├ supabaseClient.test.ts
│ │ │ └ supabaseClient.ts
│ │ ├ db/                      # SQLite 初始化与 CRUD 封装
│ │ │ ├ activityLogRepository.ts
│ │ │ ├ database.ts
│ │ │ ├ index.ts
│ │ │ ├ mappers.ts
│ │ │ ├ reviewEventRepository.ts
│ │ │ ├ schema.ts
│ │ │ ├ syncQueue/
│ │ │ │ ├ constants.ts
│ │ │ │ ├ queueRepository.ts
│ │ │ │ └ syncQueue.test.ts
│ │ │ └ wordRepository.ts
│ │ ├ state/                   # Zustand/React Query 配置与 store
│ │ │ ├ appStore.ts
│ │ │ ├ appStore.test.ts
│ │ │ ├ index.ts
│ │ │ ├ queries.ts
│ │ │ ├ queryClient.test.ts
│ │ │ ├ queryClient.ts
│ │ │ └ queryKeys.ts
│ │ ├ constants.ts             # 业务枚举、默认值与模型/环境常量
│ │ └ types/                   # 核心实体类型与构建/校验函数
│ ├ __tests__/App.test.tsx     # 首页渲染快测
│ ├ lib/db/db.test.ts          # SQLite 内存库 CRUD/外键单测
│ ├ features/README.md
│ ├ features/words/README.md
│ ├ features/review/README.md
│ ├ features/heatmap/README.md
│ ├ lib/README.md
│ ├ lib/api/README.md
│ ├ lib/db/README.md
│ ├ lib/state/README.md
│ ├ lib/constants.ts
│ ├ lib/types/index.ts
│ └ lib/types/types.test.ts
├ supabase/                    # Supabase Edge Functions 与测试
│ ├ functions/
│ │ └ ai-generator/
│ │   ├ filters.ts             # 敏感词过滤规则
│ │   ├ handler.ts             # 请求校验、CORS、限流与模型路由入口
│ │   ├ index.ts               # Edge Function 入口，绑定 Deno.serve
│ │   ├ modelProviders.ts      # OpenAI/Gemini 模型调用与解析
│ │   └ rateLimiter.ts         # 简单双窗口限流实现
│ └ tests/
│   └ ai-generator.spec.ts     # AI 代理函数的 Deno 单测
├ assets/
│ └ images/                    # 应用图标与启动图占位
├ memory-bank/                 # 设计与进度/架构文档
│ ├ architecture.md            # 当前架构快照与文件职责
│ ├ design-document.md         # 产品需求与流程
│ ├ implementation-plan.md     # 分步实施计划
│ ├ progress.md                # 历次进度记录
│ └ tech-stack.md              # 技术选型
├ prompts/                     # 约束提示
│ ├ system-prompts.md          # 系统角色与工作准则
│ └ coding-prompts.md          # 编码规范
├ app.json                     # Expo 应用元数据与资源配置
├ babel.config.js              # Babel 预设与 Reanimated 插件
├ expo-env.d.ts                # Expo Router 类型入口
├ jest.config.js               # Jest 配置（jest-expo + 别名）
├ jest.setup.ts                # RNTL、手势、Reanimated 测试初始化
├ package.json                 # 脚本与依赖声明（Expo/Router/数据层/测试）
├ package-lock.json            # npm 依赖锁定
├ tsconfig.json                # TS 严格模式与路径别名
├ .eslintrc.js                 # ESLint 规则与 TS 解析配置
├ .gitignore                   # 忽略清单
├ __mocks__/expo-sqlite.ts     # Jest 内存 SQLite 模拟（sql.js asm）
└ AGENTS.md                    # 仓库操作指南
```

## 模块关系
- app 层通过 Expo Router 从 `expo-router/entry` 启动，布局由 `app/_layout.tsx` 定义，页面（如 `app/index.tsx`）按路由文件约定渲染。
- app/components 提供无业务耦合的可复用 UI 单元（WordCard 负责卡片正反面翻转与滑动切卡回调），为 features 层组合；`app/words/new.tsx` 挂载词库新增页面。
- app/features 按业务垂直拆分：words 管理录入/列表（`components/AddWordForm` 依赖 AI 生成与新增服务，`services/createWord` 封装词条写入、活跃度累计与同步入队），review 提供复习队列抽样（2:1 权重、不足互补）、熟悉/不熟/跳过动作落库与同步（`services/reviewQueue`、`services/reviewActions`），`components/ReviewSession` 挂载 WordCard 并驱动复习与重置流程；heatmap 聚合活跃度并呈现热力图。
- app/lib 作为横切基础设施：api 封装 Supabase/AI 调用（supabaseClient 校验环境并创建单例，aiGenerator 负责调用 Edge Function、处理模型参数与超时回退），db 负责 SQLite 表结构与 CRUD（建表/外键、词条/复习事件/活跃度仓储与清理、同步队列入队/退避/冲突决策）、state 维护基于 Zustand 的全局 store（词库/复习队列/活动计数）与 React Query key、Client、预取查询配置，constants/types 提供枚举默认值与核心实体的构建/校验函数，供各业务模块复用。
- supabase/functions/ai-generator 提供 AI 生成代理 Edge Function，内置敏感词过滤、限流、模型路由（GPT-4o/3.5、Gemini Flash-Lite）与超时处理，入口绑定至 Deno.serve；supabase/tests 下使用 Deno 原生测试覆盖成功、敏感词、限流与超时分支。
- 配置层（tsconfig/babel/eslint/jest）共同保障 TypeScript、路由、动画与测试可用，`jest.setup.ts` 额外补全 Reanimated 手势模拟便于动画/滑动测试；别名 `@/*` 在源码与测试中一致。
- 资产层（assets/images）供 app.json 引用，确保打包与预览资源一致。
- 文档层（memory-bank、prompts、AGENTS.md）规定业务需求、计划、架构与操作规范，是后续开发的真源信息。***
