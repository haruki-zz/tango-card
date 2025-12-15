# 目录结构与职责速览

```
tango-card/
├ app/                         # Expo Router 页面与测试
│ ├ _layout.tsx                # SafeArea + Router Stack 布局入口
│ ├ index.tsx                  # 首页占位视图
│ └ __tests__/App.test.tsx     # 首页渲染快测
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
└ AGENTS.md                    # 仓库操作指南
```

## 模块关系
- app 层通过 Expo Router 从 `expo-router/entry` 启动，布局由 `app/_layout.tsx` 定义，页面（如 `app/index.tsx`）按路由文件约定渲染。
- 配置层（tsconfig/babel/eslint/jest）共同保障 TypeScript、路由、动画与测试可用；别名 `@/*` 在源码与测试中一致。
- 资产层（assets/images）供 app.json 引用，确保打包与预览资源一致。
- 文档层（memory-bank、prompts、AGENTS.md）规定业务需求、计划、架构与操作规范，是后续开发的真源信息。***
