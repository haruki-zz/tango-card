# tango-card TODO

> 技术栈职责、模块边界详见 `docs/stack_responsibility.md` 与 `docs/architechture.md`。

## MVP 功能
- [x] 解析用户输入的 SVG 源码并在 React 渲染层以窗口自适应方式展示（由 Electron 容器托管）。
- [x] 建立 TypeScript 单词卡片数据模型（SVG 源、创建时间等字段）。
- [x] 实现 Electron 主进程驱动的卡片保存流程（当前通过手动保存按钮触发，写入本地持久化存储）。
- [x] 提供 TypeScript 服务计算的随机抽取接口（均等抽样卡片）。
- [x] 在 React 复习视图中展示待复习的卡片并记录复习次数。
- [x] 构建 React 组件实现的 GitHub contribution 风格可视化面板显示每日学习进度。

## 技术任务
- [x] 规划 Electron 主进程与 React 渲染进程通信协议（contextBridge、IPC channel）。
- [x] 引入 React 友好的状态管理方案（如 Redux Toolkit 或 Zustand）协调卡片状态与复习队列。
- [x] 设计 TypeScript 持久化层抽象，支持未来迁移不同存储引擎。
- [x] 配置 TypeScript、ESLint、Prettier、Vite（或同类）以获得统一开发体验，并建立 React + Electron 联调脚本。
- [x] 搭建端到端测试框架（Playwright + Spectron 或类似）验证核心用户流程。

## 体验与可用性
- [x] 为 SVG 预览增加错误提示与空状态文案。
- [x] 在卡片复习时提供快捷键与触控支持，提升学习效率（方向键与多方向滑动已支持）。
- [x] 设计进度统计维度（每日新增、复习次数）并与面板联动（热力图维度切换 + 分析面板上线）。
- [x] 支持导入/导出卡片数据（JSON/ZIP）便于备份与迁移（设置页提供备份工具，含复习记录与统计）。
- [x] 基于“单词/平假名/语境/例句”输入模板化生成统一尺寸 SVG 卡片。
  - [x] 设计卡片 SVG 模板（统一画布尺寸与排版规范）。
  - [x] 在卡片编辑界面替换原有 SVG 文本输入，改为四项结构化字段。
  - [x] 实现模板渲染服务，将字段填充并输出 SVG 字符串。
  - [x] 为模板输出补充单元测试与快照，校验不同输入组合。
- [x] 移除直接粘贴 SVG 的旧代码路径，清理相关文案与提示。

## Refactor: 核心体验聚焦（详见 `docs/refactor_plan.md`）
- [x] 仅保留“创建单词卡片 / 复习队列”相关代码，删除其他屏幕与组件。
- [x] 精简路由与状态层：`AppRouter` 只暴露极简 hub、编辑器、复习视图；移除 analytics/settings 等依赖。
- [x] 重写 UI：一个最简洁的Neumorphism风格的入口界面（两枚 CTA），朴素的编辑/复习视图。
- [x] 清理无用服务、hooks、测试、资产，调整文档与 README 描述当前功能范围。
- [x] 验证：`npm run lint` + 手动走通“创建 → 复习”流程。

## UI 精简迭代（Add / Review 两大核心）
- [x] Hub 只保留“创建 / 复习”操作与关键指标：在 `src/renderer_process/screens/core_hub_screen.tsx` 中将介绍性段落改为两列布局（左侧展示已保存卡片数、待复习卡片数，右侧仅保留两个命令按钮），并使用简洁 ASCII 分隔线提示状态。
- [x] 卡片编辑界面增加步骤提示与分隔符：在 `src/renderer_process/screens/card_editor_screen.tsx` 为四个输入区添加 `[1] Word` 等编号，使用淡色虚线/边框划分段落，同时在保存区域将快捷键提示和按钮/状态拆成左右两列。
- [x] Preview 面板保持纯净：在编辑界面的预览旁只保留“比例 21:12 / 实时渲染”单行提示，删除冗余描述，把状态改成 monospace 小条幅。
- [x] 复习界面提供极简操作提示：在 `src/renderer_process/screens/review_screen.tsx` 的卡片下方增设 “[← 返回上一张 | → 标记完成] (剩余 n)” 提示，并添加一个极简“[R] 重置”链接以重新拉取队列。
- [x] SVG 卡片加上分隔视觉元素：在 `src/shared/templates/card_svg_template.ts` 中为 Context/Scene/Example 标题上方绘制 1px 线段或细边框，强化区块层次，同时保持现有 TUI 主题。

## Heat Map 活跃度面板（Hub 下方区域）
- [x] **数据准备**：在 `src/renderer_process/state/card_store.ts` / 新的统计层中，新增每日新增/复习次数的聚合接口，传给 Hub 层以便绘制热力图；必要时拓展持久化格式（考虑 `created_at`、`last_reviewed_at`）。
- [ ] **控件设计**：在 `src/renderer_process/screens/core_hub_screen.tsx` 中 commands 区域下方插入一个 GitHub 风格 heat map 容器（7 行 * ~20 列），覆写样式以适配 TUI 主题（深色背景、方格圆角、渐变色阶）。
- [ ] **渲染组件**：在 `src/renderer_process/components` 下新增 `heat_map.tsx`（或复用现有可视化组件），负责根据每日计数渲染矩阵，支持 hover 提示/键盘 focus。
- [ ] **交互与刷新**：提供“最近 30/60 天”切换或滚动视图，根据卡片增删/复习事件自动刷新数据（监听 `use_card_store` 与 `use_review_cycle`），并在无数据时显示空状态。
- [ ] **文档与测试**：更新 `docs/README_cn.md` 的界面说明，补充 heat map 统计来源与使用说明；为新组件编写最小单元测试（判断色阶映射逻辑）。
