# 开发环境配置指南

本文档梳理项目中用于统一开发体验的工具链，并说明如何在本地运行联调流程。

## TypeScript
- `tsconfig.json`：服务于渲染进程、领域层与共享代码，启用严格模式 (`strict: true`)、`jsx: react-jsx` 以及路径别名。默认 `noEmit`，配合 Vite 与 ts-jest 进行类型检查。
- `tsconfig.node.json`：继承基础配置，面向 Electron 主进程、preload 与基础设施代码，输出至 `dist/main` 并按 CommonJS 模块构建。
- `npm run typecheck`：通过 `tsc --pretty --noEmit` 校验所有 TS 项目（脚本已配置在 `package.json`）。

## ESLint
- 根目录 `eslint.config.mjs` 覆盖浏览器与 Node 环境，分层加载 `@typescript-eslint`、`eslint-plugin-react`、`eslint-plugin-jsx-a11y`，并复用 Prettier 规则避免冲突。
- `npm run lint` / `npm run lint:fix` 分别用于只读检查与自动修复，确保命名规范与 2 空格缩进等要求。

## Prettier
- `prettier.config.cjs` 约定 `tabWidth: 2`、`singleQuote: true`、`trailingComma: 'all'` 等格式策略，配合 `npm run format` 统一 Markdown、TS/TSX 的代码风格。

## Vite + Electron 联调
- 渲染进程使用 `vite.config.ts`，集成 `@vitejs/plugin-react` 并暴露 `@src`、`@shared`、`@domain` 路径别名。
- `npm run dev` 同时启动：
  1. `npm run dev:main`：`tsc --project tsconfig.node.json --watch` 实时构建主进程产物。
  2. `npm run dev:renderer`：启用 Vite Dev Server。
  3. `npm run dev:electron`：等待主进程编译完成与 Vite 可用后启动 Electron，环境变量 `VITE_DEV_SERVER_URL` 用于渲染层加载。
- 该模式保证主进程、preload 与 React 渲染层随改动热重载，实现一份命令的协同开发体验。

## 端到端测试（Playwright + Electron）
- 安装依赖：首次运行前执行 `npx playwright install --with-deps` 以安装所需运行时。
- 脚本：`npm run test:e2e` 将先构建主进程与渲染进程，再使用 Playwright 启动 Electron 应用并驱动真实 UI 流程。
- 测试入口位于 `tests/e2e/review_flow.e2e.ts`，默认覆盖卡片创建与复习视图导航，可在此基础上扩展新的场景。
- 测试运行时会读取环境变量 `TANGO_CARD_DATA_DIR` 将应用数据定向至临时目录，避免污染本地用户数据。
- 调试建议：在命令中追加 `--debug` 或使用 `PWDEBUG=1` 环境变量观察元素定位与步骤细节。

## 附加提示
- 在提交前建议执行 `npm run lint && npm run test`，确保类型、样式与行为均处于健康状态。
- 如需扩展新的存储或 IPC 通道，请同步更新 `docs/ipc_protocol.md` 与相关配置文件，使工具链对新代码保持一致约束。
