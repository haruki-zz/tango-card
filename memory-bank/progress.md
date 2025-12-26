## 2025-12-26T12:04:29Z
- 完成实施计划第 4 步：在 `src/shared` 定义词条/复习日志/活跃度类型与 SM-2 常量、默认补全与校验逻辑（时间与 SM-2 字段缺省时自动补齐），实现 SM-2 更新与复习队列排序纯函数。
- 新增 Vitest 配置与单测覆盖补全、分数边界、队列排序与 EF/间隔更新；`package.json` 改为 `vitest run` 测试脚本。
- 跑通命令：`npm test -- shared`。

## 2025-12-26T11:37:02Z
- 完成实施计划第 3 步：接入 ESLint + Prettier 规范。新增 `.eslintrc.cjs` 与 `prettier.config.cjs`，覆盖 main/preload/renderer，统一单引号。
- 更新 package.json/package-lock.json，添加 ESLint/Prettier 依赖与 `lint`/`lint:fix`/`format`/`format:fix` 脚本，`npm run lint` 全量通过。
- 为 `src/main/index.ts` 的窗口加载与 `app.whenReady()` 链路补充错误处理，解决浮动 Promise 报警。
- 按新格式化规则调整渲染端入口（App.tsx/main.tsx）。

## 2025-12-26T05:57:21Z
- 完成实施计划第 2 步：接入 electron-vite + Electron + React/Vite 骨架，主/预加载/渲染入口就绪。
- 新增 electron.vite.config.ts、tsconfig.json、electron-builder.yml、资源图标，scripts 更新为 electron-vite dev/build/preview 并调用 electron-builder。
- 创建 src/main/preload/renderer 骨架（BrowserWindow + contextBridge + React UI 展示版本信息），配置路径别名与基础样式。
- 运行 npm run build 产出 dist、dist-electron 与 release 打包（未签名 mac arm64），验证构建链畅通。

## 2025-12-26T05:43:52Z
- 完成实施计划第 1 步：初始化 npm 项目，确认 Node v25.2.1 / npm v11.6.2 满足要求。
- 更新 package.json 为 ESM，添加 dev/build/lint/test 占位脚本与 engines>=18，标记 private 以避免误发。
- 新增 .gitignore（忽略 node_modules、构建产物、日志与环境变量），创建 .env.local 含 OpenAI/Google 密钥占位避免读取缺失。
- 运行 npm install 与 npm run lint（占位输出）验证依赖安装与脚本可执行。
