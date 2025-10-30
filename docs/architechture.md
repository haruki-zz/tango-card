# tango-card Architecture

## Overview
本文件定义 tango-card 的统一目录结构与职责划分。所有新代码需要遵循这里的模块边界和命名约定，以保持简单、清晰、低耦合的实现。各技术栈职责参见 `docs/stack_responsibility.md`。

## Repository Layout
```
.
├─ docs/                 # 项目文档（架构、规范、设计草案）
├─ assets/               # 静态资源：图标、示例 SVG、演示截图
├─ config/               # 环境变量模板与打包配置
├─ scripts/              # 自动化脚本（构建、发布、数据迁移）
├─ src/                  # TypeScript + React + Electron 源码
├─ tests/                # 单元 / 集成 / 端到端测试
├─ data/                 # 本地持久化数据（Electron userData 下的逻辑挂载点）
└─ package.json          # 项目依赖与脚本入口
```

## src 目录结构
```
src/
├─ main_process/
│  ├─ app_entry.ts                # Electron 入口，创建主窗口并装载服务
│  ├─ window_manager.ts           # 维护窗口生命周期与多窗口策略
│  ├─ ipc_channels.ts             # 定义所有 IPC 通道常量
│  ├─ ipc_handlers/               # 主进程侧的 IPC 处理器
│  │  ├─ card_ingest_handler.ts   # 接收渲染进程发送的 SVG 卡片并调用持久化服务
│  │  ├─ review_session_handler.ts# 提供复习卡片拉取、记忆等级更新接口
│  │  └─ analytics_handler.ts     # 处理学习进度数据查询与推送
│  └─ service_bootstrap/          # 主进程服务初始化
│     ├─ storage_bootstrap.ts     # 启动持久化驱动与仓库实例
│     └─ settings_loader.ts       # 读取配置文件与环境变量
├─ preload/
│  └─ context_bridge.ts           # 通过 contextBridge 暴露安全 API 给渲染进程
├─ renderer_process/
│  ├─ app_shell.tsx               # React 根组件，挂载全局状态与路由
│  ├─ routing/
│  │  └─ app_router.tsx           # 定义路由结构（编辑、复习、统计、设置）
│  ├─ screens/
│  │  ├─ card_editor_screen.tsx   # 输入单词/读音/语境/例句生成统一尺寸卡片（手动保存与记忆等级选择）
│  │  ├─ review_screen.tsx        # 复习流程视图，展示抽取的卡片
│  │  ├─ analytics_screen.tsx     # 学习进度热力图与统计数据
│  │  └─ settings_screen.tsx      # 配置存储策略、显示偏好等
│  ├─ components/
│  │  ├─ svg_canvas.tsx           # 自适应窗口尺寸的 SVG 渲染组件
│  │  ├─ memory_level_badge.tsx   # 记忆等级标签展示与交互
│  │  └─ contribution_heatmap.tsx # GitHub contribution 风格热力图组件（周栅格 + 动态配色 + 图例）
│  ├─ hooks/
│  │  ├─ use_card_store.ts        # 管理卡片集合的业务状态钩子
│  │  ├─ use_review_cycle.ts      # 控制复习队列与权重计算
│  │  └─ use_element_size.ts      # 监听容器尺寸供 SVG 自适应渲染
│  ├─ services/
│  │  ├─ svg_renderer.ts          # 处理 SVG 解析、视口缩放、错误边界（TypeScript 纯函数）
│  │  ├─ memory_scheduler.ts      # 根据记忆等级计算抽取概率（TypeScript 纯函数）
│  │  └─ analytics_builder.ts     # 汇总学习数据供可视化组件使用
│  ├─ state/
│  │  ├─ card_store.ts            # 基于 Zustand 的卡片集合状态（列表 / 加载 / 错误）
│  │  └─ review_queue_store.ts    # 基于 Zustand 的复习队列及指针调度
│  ├─ styles/
│  │  └─ global.css               # Tailwind 入口与少量全局样式覆盖
│  └─ utils/
│     ├─ renderer_api.ts          # Electron 缺失时提供内存 Mock 的 API 解析器
│     └─ svg_sanitizer.ts         # 清理、验证 SVG 源码的工具函数
├─ domain/
│  ├─ card/
│  │  ├─ card_entity.ts           # 定义卡片领域模型（id、svg_source、created_at、memory_level 等）
│  │  └─ card_factory.ts          # 构建卡片实例，封装默认值与验证
│  ├─ review/
│  │  ├─ review_policy.ts         # 复习策略接口与具体实现（记忆权重 + 随机抽取）
│  │  └─ memory_level.ts          # 记忆等级枚举与相关逻辑
│  ├─ analytics/
│  │  └─ activity_snapshot.ts     # 学习进度聚合数据模型
│  └─ shared/
│     └─ result.ts                # 统一的结果类型（成功 / 失败）
├─ infrastructure/
│  ├─ persistence/
│  │  ├─ card_repository.ts       # 卡片持久化接口，供主进程与领域层调用
│  │  ├─ review_session_repository.ts # 复习记录的持久化
│  │  ├─ storage_driver.ts        # 抽象底层存储驱动接口
│  │  ├─ storage_engine.ts        # 存储引擎注册表，管理不同驱动的初始化
│  │  └─ engines/
│  │     └─ file_storage_engine.ts# 文件系统实现的存储引擎（默认）
│  ├─ storage_providers/
│  │  ├─ file_storage_provider.ts # 使用文件系统存储 JSON 数据
│  │  └─ sqlite_storage_provider.ts# 未来扩展：SQLite 存储实现
│  └─ telemetry/
│     └─ analytics_tracker.ts     # 记录学习行为事件，推动到 analytics_builder
└─ shared/
   ├─ constants/
   │  ├─ app_channels.ts          # 跨进程通道、事件名称常量
   │  └─ memory_levels.ts         # 记忆等级标签与描述配置
   ├─ errors/
   │  └─ domain_error.ts          # 标准化错误类型
   └─ utils/
      ├─ date_utils.ts            # 日期格式化、统计窗口计算
      └─ uuid.ts                  # ID 生成工具
```

## tests 目录结构
```
tests/
├─ unit/
│  ├─ card/
│  │  └─ card_factory.spec.ts
│  ├─ review/
│  │  └─ review_policy.spec.ts
│  ├─ renderer/
│  │  ├─ components/
│  │  │  ├─ contribution_heatmap.spec.tsx
│  │  │  ├─ memory_level_badge.spec.tsx
│  │  │  └─ svg_canvas.spec.tsx
│  │  ├─ screens/
│  │  │  └─ review_screen.spec.tsx
│  │  ├─ state/
│  │  │  ├─ card_store.spec.ts
│  │  │  └─ review_queue_store.spec.ts
│  │  └─ utils/
│  │     └─ renderer_api.spec.ts
│  ├─ infrastructure/
│  │  └─ persistence/
│  │     └─ storage_engine.spec.ts
│  └─ analytics/
│     └─ activity_snapshot.spec.ts
├─ integration/
│  ├─ persistence/
│  │  └─ card_repository.integration.ts
│  └─ ipc/
│     └─ review_session_handler.integration.ts
└─ e2e/
   └─ review_flow.e2e.spec.ts     # Playwright 驱动的 Electron 端到端复习流程
```

## 模块关系
- `main_process` 使用 Electron API 负责应用生命周期、IPC 通信与服务装载，不直接处理业务细节；它调用 `domain` 和 `infrastructure` 中的模块完成持久化与策略计算（具体通道契约见 `docs/ipc_protocol.md`）。
- `preload` 暴露受控接口，防止渲染进程直接访问 Node API，符合最小授权原则。
- `renderer_process` 以 React 构建界面交互，使用 hooks → services → state 组合处理业务，组件专注于 UI，逻辑函数保持 TypeScript 纯度，通过 IPC 与主进程同步数据。
- `domain` 提供纯 TypeScript 逻辑模型和策略，保持无框架依赖，确保复用与测试的便利性。
- `infrastructure` 实现具体的存储、遥测、外部服务适配器，同样使用 TypeScript 并保持与 Electron API 的隔离，可根据需要替换实现；`storage_engine.ts` 提供统一注册表，便于后续接入 SQLite 等驱动。
- `shared` 存放跨层复用的常量、错误类型和基础工具，避免重复实现。
- `tests` 按测试粒度分层，便于针对领域逻辑、集成流程和端到端体验分别验证。

遵循此结构可以确保模块职责单一、耦合度低，为后续功能迭代提供清晰边界。任何新增文件或目录需符合 snake_case 和 SRP 原则，并在提交前更新本文档。开发工具链及联调说明参见 `docs/development_setup.md`。
