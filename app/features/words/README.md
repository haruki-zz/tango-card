# app/features/words
- 管理单词录入、编辑、列表与搜索入口。
- 依赖 lib/api 获取 AI 生成结果，lib/db 写入 SQLite，lib/state 管理词库状态。
- `components/AddWordForm` 提供新增单词表单，支持词面输入、AI 生成、熟悉度选择与保存。
- `services/createWord` 负责写入 SQLite、累加新增活跃度并将词条放入同步队列。
