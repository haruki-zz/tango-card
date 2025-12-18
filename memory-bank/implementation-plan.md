# 实施计划（聚焦核心功能）

## 全局约定
- Word 表结构：`id` (UUID) / `term` / `reading` (罗马音) / `meanings` (JSON 数组，元素 `{ jp: string; zh: string; context?: string }`，优先使用日语解释 + 中文翻译) / `examples` (JSON 数组，元素 `{ jp: string; zh: string }`) / `note` / `created_at` (UTC)。编辑已保存单词不计入新增。
- ReviewSession 结果：按单词记录掌握度，状态枚举 `familiar` / `unfamiliar`，不计总览状态。
- 队列规则：少于 30 个单词时取全部，唯一且不补足。
- 活跃度统计：`reviews_completed` 按 session 计数，未完成 session 也计入；`words_added` 仅新增时 +1。
- AI 响应标准键：`reading` / `meanings` / `examples`。默认模型 Gemini 2.5 Flash Lite，可切换 GPT-4o / GPT-3.5 / Gemini 2.5 Flash Lite；环境变量名按各 API 官方推荐设置。首选输出语言：日语原文 + 中文翻译。
- 时间基准：所有日期聚合使用 UTC。Heat Map 颜色梯度使用绿色，越深代表活跃度越高。

## 阶段 1：环境与骨架
1. 初始化项目结构：创建 electron 主进程、renderer (React+Vite)、db、scripts 目录，配置 npm 项目、TypeScript、ESLint/Prettier、Vitest 与基础 npm scripts（dev/lint/test/build/dist）。  
   - 测试验证：执行 npm install，随后运行 npm run lint 与 npm test，确认基础环境无报错。
2. 配置 Electron 主进程：启用 contextIsolation，设置 BrowserWindow 安全选项，加载预加载脚本，准备用户数据目录路径获取方法。  
   - 测试验证：npm run dev 启动后确认窗口正常打开且窗口对象不暴露 Node API（通过开发者工具检测 window.process 不存在）。
3. 编写 preload 安全桥：使用 contextBridge 暴露受控 API 容器，预留 word/review/activity/ai 方法占位，并确保类型定义集中管理。  
   - 测试验证：Vitest 针对 preload 导出的 API 结构做类型与存在性检查，确认未暴露多余字段。
4. 搭建 renderer 基线：创建 React + Vite 入口，集成 Tailwind（包含基本配色、字体、spacing 约定），设置全局布局与导航占位。  
   - 测试验证：npm run dev 访问初始页面，确认导航与主区域渲染成功；运行 npm test 检查根组件烟雾测试通过。

## 阶段 2：数据层与 IPC
5. 建立 SQLite + Drizzle：定义 Word（含 JSON `meanings`/`examples`）、ReviewSession（按词粒度 `result` 状态存储，枚举 `familiar`/`unfamiliar`）、Activity（按 UTC 日期存 counts）表 schema，配置迁移脚本与用户数据目录下的数据库初始化流程。  
   - 测试验证：运行迁移命令生成并应用迁移文件；Vitest 以临时数据库实例校验表结构、约束与默认值。
6. 数据访问封装：在主进程实现仓储函数（增词、随机取词、创建复习 session、写入活动统计、查询活跃度），封装错误处理与事务边界；随机取词在少于 30 条时返回全量且不重复。  
   - 测试验证：Vitest 对仓储函数进行数据库级单测，包含成功路径、错误路径与事务回滚场景。
7. IPC 白名单 API：在主进程注册 word:add、word:listRandom、review:create、activity:stats 等频道，统一输入校验与错误映射；preload 暴露对应调用方法。  
   - 测试验证：Vitest 使用 electron-mock-ipc 或手动 stub 对 IPC 调用进行往返测试，确保请求参数校验和响应格式正确。

## 阶段 3：AI 服务与新增单词（核心）
8. AI 调用模块：实现基于 fetch 的可插拔客户端，支持 API Key 环境变量（按各模型官方推荐名称）、超时、最多 2 次重试、JSON 解析为 `reading`/`meanings`/`examples` 结构，默认走 Gemini 2.5 Flash Lite；输出以日语内容为主，附中文翻译。  
   - 测试验证：Vitest 使用 mocked fetch 覆盖成功、超时重试、解析失败回退到“待补全”标记的分支。
9. 新增单词表单：在 renderer 创建输入表单（term、note、AI 生成按钮、编辑区域），状态管理使用 React Query + Zustand；支持 AI 生成中 Loading、失败提示与草稿保存。  
   - 测试验证：React Testing Library 触发表单提交，断言成功保存调用 IPC；模拟 AI 失败时草稿仍保留且可重新生成。
10. 单词列表/详情展示：实现基础列表或最近新增区域以便确认保存成功，并提供再次编辑入口。  
    - 测试验证：React Testing Library 渲染后检索新增项，确认状态更新与编辑保存走通。

## 阶段 4：复习队列与卡片（核心）
11. 复习队列逻辑：在 renderer 编写队列 store，调用 word:listRandom 获取 30 张唯一卡片（不足则全量，不重复），支持重新抽取与队列进度。  
    - 测试验证：Vitest 对队列生成函数进行随机性与唯一性检查，模拟少于 30 个词时的边界处理。
12. ReviewSession 记录：完成 review:create 调用以保存本次词 IDs、开始/完成时间与逐词掌握标记（`familiar`/`unfamiliar`）；处理失败时重试或缓存，未完成 session 也计入 `reviews_completed`。  
    - 测试验证：Vitest 使用 mock IPC 验证成功写入与失败重试分支；断言持久化结果包含掌握状态。
13. 卡片组件与交互：设计卡片正反面内容（单词、读音、释义、例句），实现点击/键盘翻转动画（<250ms），支持上下/左右切换。  
    - 测试验证：React Testing Library 触发 click/键盘事件，断言卡片状态切换与动画 class 变化；覆盖可访问性焦点行为。
14. 复习流程整合：将队列、卡片、进度条与掌握/未掌握按钮串联，确保完成后写入 ReviewSession 与 Activity。  
    - 测试验证：端到端级组件测试，模拟完整 30 张流程，检查最终调用 review:create 与 activity 统计更新。

## 阶段 5：Heat Map 活跃度（核心）
15. 活跃度聚合查询：在主进程实现最近 12 周的按日聚合（words_added、reviews_completed），以 UTC 日期分组，返回适配 Heat Map 的数据结构。  
    - 测试验证：数据库单测构造多日数据，断言聚合结果与日期排序正确，缺失日期填零。
16. Heat Map 组件：在 renderer 绘制格子矩阵，绿色梯度（越深越活跃），支持 hover 提示与点击弹出该日详情（显示新增/复习数量）。  
    - 测试验证：React Testing Library 验证格子数量、颜色梯度、悬浮提示文本及点击后详情显示。

## 阶段 6：可靠性与打包
17. AI 失败回退与离线提示：实现统一的错误提示组件，新增单词时网络不可用提示“保存草稿稍后补全”，并记录重试入口。  
    - 测试验证：模拟离线/异常场景，确认 UI 提示与草稿保存；Vitest 覆盖错误路径。
18. 无障碍与键盘操作检查：确保导航、按钮、卡片翻转均可通过键盘完成，焦点可见。  
    - 测试验证：React Testing Library 使用 user-event 键盘操作覆盖关键路径，运行 eslint-plugin-jsx-a11y 检查。
19. 打包与分发：配置 Vite build 与 electron-builder，确保应用资源指向正确，设置应用图标与基本元数据。  
    - 测试验证：执行 npm run build 与 npm run dist，安装生成的包做冒烟测试（启动、新增单词、复习一张、查看 Heat Map）。

## 阶段 7：后续迭代占位
20. 预留扩展：记录可选迭代项（SM2 算法、TTS 播放、导入导出、多语言 UI），在进度文档中标注优先级与所需接口。  
    - 测试验证：无代码验证，更新 progress.md 与相关 issue/任务列表，确认需求记录完整。
