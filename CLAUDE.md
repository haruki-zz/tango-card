# 目录结构与职责速览

```
tango-card/
├ app/                         # Expo Router 页面、业务模块与测试
│ ├ _layout.tsx                # SafeArea + Router Stack 布局入口
│ ├ index.tsx                  # 首页占位视图
│ ├ components/                # 复用 UI 组件集合
│ ├ features/                  # 业务模块（词库/复习/热力图）
│ │ ├ words/                   # 单词录入、编辑、列表与搜索
│ │ ├ review/                  # 复习流程、卡片翻转与标记
│ │ └ heatmap/                 # 活跃度聚合与热力图视图
│ ├ lib/                       # 横切能力层（API/DB/状态/类型）
│ │ ├ api/                     # Supabase/AI 等服务封装
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
│ ├ components/README.md
│ ├ features/README.md
│ ├ features/words/README.md
│ ├ features/review/README.md
│ ├ features/heatmap/README.md
│ ├ lib/README.md
│ ├ lib/api/README.md
│ ├ lib/api/supabaseClient.test.ts
│ ├ lib/api/supabaseClient.ts
│ ├ lib/db/README.md
│ ├ lib/state/README.md
│ ├ lib/constants.ts
│ ├ lib/types/index.ts
│ └ lib/types/types.test.ts
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
- app/components 提供无业务耦合的可复用 UI 单元，为 features 层组合。
- app/features 按业务垂直拆分：words 管理录入/列表，review 负责复习流程与标记，heatmap 聚合活跃度并呈现热力图。
- app/lib 作为横切基础设施：api 封装 Supabase/AI 调用（含 supabaseClient 对环境变量的裁剪校验与单例创建），db 负责 SQLite 表结构与 CRUD（建表/外键、词条/复习事件/活跃度仓储与清理、同步队列入队/退避/冲突决策）、state 维护基于 Zustand 的全局 store（词库/复习队列/活动计数）与 React Query key、Client、预取查询配置，constants/types 提供枚举默认值与核心实体的构建/校验函数，供各业务模块复用。
- 配置层（tsconfig/babel/eslint/jest）共同保障 TypeScript、路由、动画与测试可用；别名 `@/*` 在源码与测试中一致。
- 资产层（assets/images）供 app.json 引用，确保打包与预览资源一致。
- 文档层（memory-bank、prompts、AGENTS.md）规定业务需求、计划、架构与操作规范，是后续开发的真源信息。***
