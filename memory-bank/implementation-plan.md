# 开发实施计划（给 AI 开发者）

## 全局约定
- 时间字段统一使用 Unix 秒（UTC）。
- `tags` 统一存 JSON 数组。
- 新建卡片 SRS 默认：`level/repetitions/interval = 0`，`due_at/last_reviewed_at = null`，`ease_factor = 2.5`。
- 读音使用假名（不使用罗马音）。
- `examples_json` 为数组，每项存例句字段 `{ sentence_jp, sentence_cn }`。

## 核心阶段（先完成核心功能）

1) 初始化项目骨架  
   - 指令：使用 Electron + Vite + React + TypeScript 创建基础工程，配置 `npm` 脚本：`dev`、`build`、`test`、`lint`、`e2e`（可占位）。启用 `contextIsolation: true`，禁用 `nodeIntegration`。  
   - 验证：运行 `npm run dev` 可启动空白窗口；检查 `package.json` 存在上述脚本。

2) 配置质量工具  
   - 指令：添加 ESLint（TS/React 规则）、Prettier、Vitest、Playwright（预留），确保 `npm run lint` 和 `npm run test` 可执行。  
   - 验证：执行 `npm run lint`、`npm run test` 均通过（可为空测试）。

3) 建立主/渲染进程边界  
   - 指令：通过 `contextBridge` 暴露白名单 API（ai, db, settings, files），使用 TypeScript 定义 IPC 接口类型。参考签名（按需调整）：  
     - `ai.generateWordData(term: string): Promise<GenerateWordDataResult>`  
     - `db.getTodayQueue(): Promise<WordCard[]>`  
     - `db.answerReview(input: AnswerReviewInput): Promise<AnswerReviewResult>`  
     - `settings.getSettings(): Promise<AppSettings>` / `settings.updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>`  
     - `files.importWords(filePath: string): Promise<ImportResult>` / `files.exportBackup(): Promise<ExportResult>`  
   - 验证：在渲染层调用 `window.api`（占位）返回预期的模拟值；Vitest 编写接口存在性测试。

4) 搭建 SQLite 数据层（核心）  
   - 指令：主进程集成 SQLite（better-sqlite3），用 Drizzle 定义表：`words`、`review_events`、`daily_activity`、`settings`。字段约束：  
     - 所有时间字段（含 `due_at`、`last_reviewed_at` 等）使用 Unix 秒 UTC。  
     - `tags` 存 JSON 数组。  
     - `examples_json` 为 `{ sentence_jp, sentence_cn }[]`。  
     - 新卡默认 SRS：`level/repetitions/interval = 0`，`due_at/last_reviewed_at = null`，`ease_factor = 2.5`。  
   - 验证：运行初始化脚本后，表正确创建；Vitest 读取 schema 验证字段存在与默认值。

5) 实现 AI 调用模块（占位+回退）  
   - 指令：在主进程实现 AI 客户端，支持配置 API Key/模型（Gemini-Flash-2.5-Lite 默认，备选 gpt-4o/gpt-4.1-mini）。提供 `generateWordData(term)`，返回结构参考：  
     - 成功：`{ ok: true, data: { term, pronunciation, definition_cn, examples: { sentence_jp, sentence_cn }[] } }`。  
     - 失败：`{ ok: false, error: { code, message, detail? } }`，错误码自定义，message 面向前端。  
   - 验证：Vitest 使用 mock HTTP 验证成功/失败路径；渲染层收到错误时能继续手动输入。

6) 新增单词表单（核心流）  
   - 指令：渲染层创建“新增”视图：输入单词 → 触发生成 → 展示假名读音/释义/例句可编辑 → 保存到 DB。AI 失败时允许手动完整填写后保存；单词保存后默认不再允许修改（如需再次编辑需明确二次流程）。  
   - 验证：手工流：输入词 → 成功生成并保存；模拟 AI 失败时仍可保存。Vitest/React Testing Library 检查按钮禁用/错误提示逻辑。

7) 单词卡片组件（双面）  
   - 指令：实现卡片组件：正面显示词+假名读音，背面显示词+假名读音+释义+例句；点击/空格翻转，扁平风格。  
   - 验证：组件测试确保正背面切换；键盘事件触发翻转；示例数据渲染字段正确。

8) 复习队列生成（30 张）  
   - 指令：实现队列构建：  
     - 先取所有到期卡（按 `due_at` 升序）。  
     - 若不足 30，再从“新卡池”（`srs_level = 0` 且 `last_reviewed_at = null`）随机补充。  
     - 若仍不足 30，不强行补满。  
   - 验证：Vitest 构造数据集，验证排序、补足与长度上限逻辑。

9) 复习交互 + SRS 更新  
   - 指令：复习视图加载队列，展示卡片，支持翻转与 Again/Hard/Good/Easy（快捷键 A/H/G/E）；基于常规 SM-2 参数更新 `srs_level/interval/due_at` 等，记录 `review_events`。  
   - 验证：Vitest 针对 SRS 计算（不同评分的间隔变化），以及事件写入；手工流检查 30 张进度与快捷键。

10) Heat Map 数据生成与展示  
    - 指令：实现按日聚合 `words`（新增）与 `review_events`（复习）求和为每日 count；展示近 12 个月 7×N 网格。颜色 5 档：0=无记录，1–3=level1，4–7=level2，8–15=level3，16+=level4。  
    - 验证：Vitest 聚合函数测试（输入样本数据输出正确计数与档位）；手工检查 UI 显示与切换。

11) 设置与配置存储  
    - 指令：添加设置视图，存储 API Key、模型（默认 Gemini-Flash-2.5-Lite）、批次大小（默认 1）、主题（`light`|`dark`|`system`，默认 `light`）等到 `settings` 表，通过主进程 IPC 读写。  
    - 验证：手工修改后重启仍保留；Vitest 确认读写函数正确。

12) 错误与离线回退  
    - 指令：实现 AI 失败与离线提示，允许离线手动保存完整词条；需要补全时由用户手动触发 AI 生成（无自动补全状态位）。  
    - 验证：Vitest 模拟无网/失败路径；手工检查离线保存与后续手动补全流程。

13) 打包与签名检查  
    - 指令：配置 Electron Builder 目标 `.dmg` 与 `.msi/.exe`；使用占位 appId `com.example.jpvocab` 与占位图标，签名配置占位但不接正式证书；确保忽略 `.env.local` 等敏感文件。  
    - 验证：运行 `npm run build` 产物可执行到空白/主界面；检查打包日志无错误。

## 后续完善（在核心完成后）
- 性能/UX：懒加载词库列表、卡片翻转动画优化、键盘无障碍提示。  
- 监控：按需集成 Sentry。  
- 导入导出：JSON/CSV 导入导出词库，验证导出/导入后数据一致。  
- 设计令牌：统一色板/空间/阴影/圆角，快照测试确保一致性。***
