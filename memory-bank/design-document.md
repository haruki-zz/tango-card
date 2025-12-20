# Tango Card — 设计文档

## 目标与范围
- 为 macOS / Windows 提供一款现代化、扁平风格的日语单词记忆桌面应用。
- 核心流程：AI 辅助新增单词、双面单词卡片展示、30 张队列复习、GitHub 风格 Heat Map 活跃度展示。

## 设计原则
- 极简清晰：留白充足、高可读字体、拒绝拟物。
- 快速路径：一键生成内容、便捷翻卡、迅速标记复习结果。
- 可离线：复习与历史离线可用；AI 生成需联网，失败时允许手动输入。

## 技术与平台
- 框架：Electron（主进程 + React/Vite + TypeScript），跨 macOS/Windows；Linux 次要。
- UI：React + Tailwind/原子化 CSS，设计令牌统一色彩/间距/字体。
- 数据：SQLite（Prisma/Drizzle），本地存储，v1 不做云同步。
- AI：可替换的 OpenAI / Gemini 兼容 HTTP 接口，封装为主进程服务，经安全 IPC 调用。

## 核心功能
1) **新增单词（AI 丰富）**
   - 输入日语单词；可选手动补充释义/例句。
   - AI 返回：平假名读音、带情景的简洁中文释义、1 组例句（JP + CN gloss）。
   - 用户可在新增流程中编辑生成结果；失败时提示并允许完全手动保存。保存落库后默认不再提供编辑入口。
2) **单词卡片**
   - 双面翻转（点击/空格）；单列布局。
   - 正面：单词 + 平假名读音；背面：单词、假名读音、释义、例句。
   - 扁平风格，高对比度，轻边框或浅投影。
3) **复习队列（30 张）**
   - 每日最多 30 张；优先抽取到期 SRS 卡片，不足时随机补足。
   - 操作：翻转；标记 Again/Hard/Good/Easy（快捷键 A/H/G/E）；如已熟记可不翻面直接切换下一张，同时记为最低难度（Easy）。
   - 显示进度（如 12/30）与连续天数徽章。
4) **Heat Map 活跃度**
   - GitHub 栅格样式，按日展示新增/复习次数，4–5 级颜色梯度。
   - 切换视图（新增 vs 复习），悬停提示数值，点击查看当日详情。

## 关键用户旅程
- **新增**：输入单词 → 生成 → AI 填充读音/释义/例句 → 用户微调 → 保存（落库后内容默认不可再改）→ 卡片预览。
- **复习**：开始复习 → 正面 → 翻面（可选）→ 标记难度或直接跳过已熟记（自动记为最低难度）→ 下一张；结束展示正确率（计算方式：Only Good/Easy 计为正确，Again/Hard 计为不正确）与各档次数统计，以及下次到期预估（复习阶段不调用 AI，仅从本地数据库读取卡片内容）。

## UI 与交互
- 布局：左侧导航（首页、添加、复习、Heat Map、设置），右侧主内容。
- 字体：现代无衬线（SF Pro / Segoe UI / Noto Sans JP fallback），正文 14–16，标题 24。
- 色彩：`bg` 低饱和浅灰/米白，`ink` 近黑，`accent` 青绿/蓝，`muted` 灰；按钮扁平，轻微 hover 提示。
- 动效：卡片 3D 翻转，列表渐显，时长 ≤200ms。
- 无障碍：高对比度，清晰焦点框；翻转/评分均有快捷键与 ARIA 标注。

## 数据模型（SQLite）
- 时间字段统一使用 Unix 秒（UTC），`tags` 存 JSON 数组。
- `words`: id, term, pronunciation (假名), definition_cn, examples_json（仅 `sentence_jp/sentence_cn` 列表）、created_at, updated_at, srs_level, srs_repetitions, srs_interval, ease_factor, last_reviewed_at, due_at, tags
- `review_events`: id, word_id, result(again/hard/good/easy), reviewed_at, delta_seconds
- `daily_activity`: date, words_added_count, reviews_done_count（可聚合或缓存）
- `settings`: api_key, preferred_model, review_batch_size(默认 1), theme

## 复习 / SRS 逻辑
- 基于 SM-2：按 Again/Hard/Good/Easy 调整间隔，更新 `srs_level` 与 `due_at` 等字段（新卡默认 level/repetitions/interval=0，due_at/last_reviewed_at=null，ease_factor=2.5）。
- 队列生成：先取到期项按 `due_at` 排序；不足 30 时从新卡池（srs_level=0 且 last_reviewed_at=null）随机补足，不足 30 时不强行补满。
- 每次评分写入 `review_events`；总结页基于会话内聚合。

## AI 提示示例
- System: “你是一名简洁的日语导师。返回平假名读音、带情景的简短释义，以及 1 组例句（JP + CN gloss）。” （prompt可编辑）
- User: “Word: {term}. 若为专有名词/俚语请简述。”
- 校验：必须有平假名读音；释义约 140 字符内；例句控制长度以便卡片展示。

## Heat Map 数据
- 来自 `daily_activity` 或对 `review_events`/`words` 按日聚合。
- 展示近 12 个月 7×N 网格；颜色 5 档：0=无记录，1–3=低，4–7=中，8–15=高，16+=非常高；方块留 2px 间距；顶部月份标签，悬停提示计数。

## 导航结构
- 首页：连续天数、快速统计、开始复习按钮、小型 Heat Map。
- 添加：输入 + 生成 + 可编辑字段 + 保存。
- 复习：卡片栈、进度提示、评分控制、总结弹窗。
- Heat Map：全幅栅格，新增/复习切换，日详情列表。
- 设置：API Key/模型、批次大小、主题、数据导入导出。

## 错误与离线
- AI 不可用：提示并允许手动输入保存。
- 写入由主进程服务负责，前端乐观更新；AI 调用放后台线程防卡 UI。
- 离线：复习完整可用；新增可离线手动保存完整词，后续需用户手动触发 AI 补全（不额外持久化状态标记）。
 - 复习阶段不修改卡片内容，仅读取数据库中已保存的数据。

## 非目标（v1）
- 云端/多设备同步；账号体系；移动端打包。

## 交付与打包
- 包管理：统一使用 `npm`。
- 开发：`npm run dev`（Vite + Electron）；测试用 Vitest + Playwright。
- 发布：Electron Builder 生成 `.dmg` 与 `.msi/.exe`，按平台签名。
