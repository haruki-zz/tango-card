## 初始化骨架
- 设立 Electron + Vite + React + TypeScript 基础工程，脚本覆盖 dev/build/test/lint/e2e 占位。
- 配置主/预加载/渲染的 TypeScript 方案与 Vite 构建输出目录，启用 contextIsolation、禁用 nodeIntegration。
- 构建验证通过（npm run build），渲染层展示占位 UI 并可通过 preload ping。

## 配置质量工具
- 安装并落地 ESLint + Prettier（eslint.config.cjs、prettier.config.cjs），更新 npm 脚本启用 lint/format。
- 添加 Vitest 配置与占位用例（vitest.config.ts、tests/smoke.test.ts），`npm run test` 通过。
- 预置 Playwright 配置与空场景（playwright.config.ts、e2e/smoke.spec.ts），完成浏览器依赖安装并使 `npm run e2e` 通过。
- 调整 .gitignore 增加 coverage/playwright-report/test-results，渲染 App 使用惰性初始化读取 preload ping 以满足新 lint 规则。

## 主/渲染进程边界
- 建立 shared 类型与通道（src/shared/apiTypes.ts、src/shared/ipcChannels.ts），约束 ai/db/settings/files 白名单接口。
- 预加载通过 createPreloadApi（src/preload/createApi.ts）包装 ipcRenderer.invoke，暴露 window.api，渲染 env.d.ts 引用 shared 类型。
- 主进程注册模拟 IPC handler（src/main/ipcHandlers.ts），main.ts 启动时加载，提供可预测的 mock 数据（AI 生成、队列、复习反馈、设置读写、导入导出）。
- 增补 ipc 边界单测（tests/ipc-boundary.test.ts）验证 window.api 方法可用；`npm run test` 通过。
