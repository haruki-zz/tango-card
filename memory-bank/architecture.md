# 架构记录

## 阶段状态
- 已完成实施计划第 9 步：渲染端状态管理接入（Zustand store 覆盖词库/复习队列/session/活跃度/provider），IPC 异步动作封装完毕，等待 UI 层调用。

## 文件作用
- package.json：项目元数据，使用 ESM，声明 Node >=18 要求与 Electron/React/Vite/TypeScript 依赖，前端状态管理依赖 Zustand；scripts 含 electron-vite dev/build/preview、lint/lint:fix、format/format:fix，build 调用 electron-builder 产出安装包。
- package-lock.json：npm 锁定文件（包含 Electron、React、构建链依赖）。
- .gitignore：忽略 node_modules、构建产物（dist、dist-electron、release）、日志、.env.* 与 .vite。
- .env.local：存放 OpenAI/Google 密钥占位，避免读取缺失时报错，默认不提交。
- .eslintrc.cjs：全局 ESLint 配置，启用 TypeScript/React/React Hooks/Prettier 规则集，设置浏览器与 Node 环境覆盖 main/preload/renderer，忽略 dist/dist-electron/release/out/node_modules。
- prettier.config.cjs：Prettier 配置，统一单引号。
- electron.vite.config.ts：electron-vite 配置，定义 main/preload 输出目录与 React 插件、渲染端别名。
- electron-builder.yml：electron-builder 打包配置，指定 appId/productName、输出目录（release）、macOS/Windows/Linux 目标与主入口。
- tsconfig.json：TypeScript 编译配置，启用 strict，路径别名覆盖 main/preload/renderer。
- resources/icon.png：占位应用图标（512x512 PNG），供 electron-builder 使用。
- src/main/index.ts：主进程入口，创建 BrowserWindow、绑定 preload、处理 URL/文件加载与生命周期。
- src/main/storage.ts：基于 `app.getPath('userData')` 的存储层，管理 `words.jsonl`/`reviews.jsonl`/`activity.json`，读写使用临时文件写入再替换；新增词条补全时间与 SM-2 默认值并更新活跃度，复习日志写入与 session 计数累加；支持全量保存、JSON/JSONL 导入（按 `word` 去重覆盖、跳过非法记录计数）、导出 JSON+CSV（写入 `exports/` 子目录）。
- src/main/ipc/handlers.ts：集中注册 IPC 信道，校验参数并调用存储/AI/provider 配置；提供词条列表/新增、AI 生成、复习队列、提交评分（含 SM-2 更新与日志写入）、活跃度读取/累加、provider 设置、导入/导出接口。
- src/main/ai：
  - types.ts：AI provider 公共接口、请求/响应结构及默认超时/输出长度配置。
  - utils.ts：提示词生成、模型输出截断与 JSON 解析辅助、超时包装。
  - openai.ts：基于官方 Responses API 的 OpenAI provider，使用 `responses.create` + JSON Schema（strict 模式）生成词条内容。
  - gemini.ts：基于官方 `@google/genai` SDK 的 Gemini provider，调用 `models.generateContent`，按 JSON MIME 返回解析。
  - mock.ts：无密钥固定响应的 mock provider，用于 dev/测试。
  - index.ts：provider 工厂与出口，支持 openai/gemini/mock 配置与兜底。
- src/main/__tests__/storage.test.ts：FileStorage 的 Vitest 单测，覆盖默认补全、JSONL 格式、活跃度累加与写入失败保护。
- src/main/__tests__/ai.test.ts：AI provider 单测，覆盖 OpenAI/Gemini 正常与错误/超时路径，以及 mock 截断输出。
- src/preload/index.ts：预加载脚本，通过 contextBridge 暴露平台与版本信息，以及受控 `window.api` IPC 调用集合（词条增/查、AI 生成、复习、活跃度、provider 设置、导入/导出）。
- src/renderer/index.html：渲染进程 HTML 入口。
- src/renderer/src：渲染进程 React/Vite 骨架（App.tsx 展示版本信息、main.tsx 挂载、基础样式与类型声明）；store/useAppStore.ts 提供全局 Zustand store 封装 IPC 动作（词库、复习队列/session、活跃度、provider 设置、导入/导出），`__tests__/useAppStore.test.ts` mock window.api 校验状态更新与错误路径。
- src/shared：
  - types.ts：词条、复习日志、活跃度类型定义，SM-2 常量（EF 下限、默认值、间隔基线）。
  - sm2.ts：SM-2 默认状态生成、评分更新公式、复习队列排序与日期加成等纯函数。
  - validation.ts：词条/复习日志/活跃度的 JSON 校验与补全逻辑；时间与 SM-2 字段缺失时按当前时刻与默认值填充。
  - ipc.ts：IPC 信道常量、请求/响应类型、渲染端 API 类型（含导入/导出格式与返回路径），供主进程 handler 与 preload 共享。
  - __tests__：使用 Vitest 覆盖 SM-2 更新、分数边界、队列排序与校验补全边界。
- src/main/__tests__/ipc.test.ts：主进程 IPC handler 集成单测，覆盖入参校验、SM-2 更新、活跃度日期验证、provider 配置错误、导入/导出链路与未知信道拒绝。
- src/main/__tests__/import-export.test.ts：FileStorage 导入/导出单测，覆盖去重覆盖、非法输入跳过与导出 JSON/CSV 内容。
- CLAUDE.md：仓库当前架构快照，描述目录与文件职责，需随架构变更同步。
- AGENTS.md：贡献规范与全局约束的入口说明。
- prompts/coding-style.md：代码风格与开发流程约定。
- prompts/system-prompt.md：系统级工作规范与思考模式。
- memory-bank/design-document.md：产品功能与数据设计说明。
- memory-bank/implementation-plan.md：分步实施计划，当前执行至第 8 步。
- memory-bank/tech-stack.md：技术栈清单与选型理由。
- memory-bank/progress.md：阶段性变更记录，便于交接。
- memory-bank/architecture.md：架构与文件职责记录（本文件），持续更新各阶段的结构洞察。
- vitest.config.ts：Vitest 配置（Node 环境、路径别名 `@shared`/`@main` 解析）。
