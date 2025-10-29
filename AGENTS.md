# Repository Guidelines

## Project Structure & Module Organization
本仓库实现 TypeScript + React + Electron 的 tango-card 词汇记忆应用。遵循 `docs/architechture.md` 中的层次：`src/main_process` 负责窗口与 IPC，`src/renderer_process` 使用 React 承担界面与交互，`src/domain` 提供纯业务模型，`src/infrastructure` 管理存储与适配器，`src/shared` 存放跨层常量与工具。状态与复习调度逻辑集中在 `renderer_process/state` 与 `renderer_process/services`，确保 UI 与业务分离；可视化组件位于 `renderer_process/components` 并与 hooks 解耦。`assets/` 保存图标、示例 SVG，`data/` 用于 Electron `userData` 的卡片存储挂载点，`tests/` 按 unit/integration/e2e 分层，更多背景见 `docs/README_cn.md`、`docs/TODO.md` 与 `docs/stack_responsibility.md`。

## Build, Test, and Development Commands
运行 `npm install` 初始化依赖。`npm run dev` 启动 Electron + Vite 驱动的 React 渲染进程，并监控 `src` 改动自动刷新；`npm run build` 生成打包产物到 `dist/`，同时静态检查 TypeScript。`npm test` 执行 Jest 套件，`npm run test:coverage` 检查 ≥90% 覆盖率；`npm run lint`、`npm run lint:fix` 与 `npm run format` 需在提交前保持通过。新增脚本时同步更新 `package.json` 与相关文档说明，并在 PR 描述写明使用场景。

## Coding Style & Naming Conventions
严格遵循 `docs/coding_principles.md`：文件与模块使用 `snake_case`，函数与变量用 `snake_case`，类型与类为 PascalCase，常量为 UPPER_SNAKE_CASE。保持 2 空格缩进，避免提前抽象，确保每个模块聚焦单一职责。样式优先使用 Tailwind CSS 实用类，必要时在 `src/renderer_process/styles/global.css` 中补充全局覆盖。ESLint + Prettier 处理格式；禁止直接修改 `dist/` 或生成文件。提交前确认代码讲述清晰意图，补充必要的“why”级注释，并移除冗余实现以保持 DRY；如需共享逻辑，优先提取到 `src/shared` 或领域层，React 组件仅承担渲染职责。

## Testing Guidelines
测试命名以源文件为镜像：`src/domain/card/card_factory.ts` 对应 `tests/unit/card/card_factory.spec.ts`。优先验证行为而非实现细节，对复习调度和 SVG 渲染编写集成测试，并为关键 Electron 流程维护 E2E 脚本（参考 `tests/e2e/review_flow.e2e.ts`）。任何持久化或 IPC 改动需添加回归测试，新增功能必须补齐最小可行测试，且不得降低覆盖率阈值；测试文档与案例关联请更新 `docs/TODO.md` 中的相关条目。

## Commit & Pull Request Guidelines
提交信息使用祈使句与类型前缀（例如 `feat: add memory scheduler weighting`），保持单一职责。PR 需包含：变更摘要、测试证明或复现步骤、涉及的 TODO 条目及其状态，以及可能影响的学习数据迁移策略。引用 issue 时使用 `Closes #123` 语法。若调整架构或目录，务必先更新 `docs/architechture.md` 并在描述中注明，并附上对现有模块的影响分析。至少请求一名维护者审核后再合并，合并策略使用 squash 以保持历史清晰。

## Security & Configuration Tips
环境变量统一记录于 `.env.example`，真实密钥存储在本地安全管理工具中。SVG 卡片保存前调用 `src/renderer_process/utils/svg_sanitizer.ts` 过滤潜在危险内容，敏感字段（例如卡片备注中的个人信息）务必脱敏。学习数据写入 `data/` 目录时要处理写入失败的回退逻辑，避免损坏用户历史记录；提交包含数据迁移的改动时附带验证步骤与回滚计划，并在 PR 中标记 `needs-migration` 标签。

## Collaboration Workflow & Knowledge Base
开发前先审阅 `docs/TODO.md` 与最新 issue，确认任务优先级；如需新增功能，先在 TODO 中登记并讨论实现计划。定期更新 `docs/README_cn.md` 以反映新的用户流程或界面截屏，确保非英语贡献者也能及时了解状态。团队约定在周度同步会上回顾 `data/` 统计与热力图效果，并记录结论到 `docs/architechture.md` 的附注段落，以保持架构与实践一致。
