# 架构快照（基础骨架 + 模块目录）

## 平台与框架
- 使用 Expo SDK 54 + Expo Router 6，React 19 / React Native 0.81，TypeScript 严格模式，入口为 `expo-router/entry`。

## 配置与工程基础
- package.json: 脚本（start/android/ios/web/lint/test），依赖（Expo 栈、React Query、Zustand、SQLite、Supabase JS、Reanimated、手势、Safe Area/Screens、RN Web），devDependencies（eslint+universe 规则、jest-expo、RNTL、TS）。
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

## 资产
- assets/images/*: 应用图标、启动图、favicon 占位资源。

## 状态
- 当前完成实施计划第 2 步（建立模块化目录骨架）：业务模块与横切层目录已创建并附 README 定义职责，等待后续按计划补充类型与实现。***
