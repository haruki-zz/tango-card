# Electron ↔︎ React IPC 通信协议

本文件定义渲染进程（React）与主进程（Electron）之间所有已实现的 IPC 通道、请求/响应负载以及扩展准则。所有新增通道必须先在此处登记并同步更新 `src/shared/ipc/contracts.ts`，确保类型与实现一致。

## 通道映射

| 通道 (channel) | 方向 | 请求结构 | 响应结构 | 说明 |
| --- | --- | --- | --- | --- |
| `card:ingest` | Renderer → Main | `{ card_id?: string, svg_source: string, tags?: string[], memory_level?: MemoryLevel, created_at?: string }` | `CardEntity` | 创建或更新单词卡。主进程会根据是否携带 `card_id` 调用对应的持久化逻辑，并更新学习统计。 |
| `card:list` | Renderer → Main | `void` | `CardEntity[]` | 拉取全部单词卡，供编辑器与复习流程同步状态。 |
| `review:queue` | Renderer → Main | `{ size?: number }` | `ReviewCandidate[]` | 请求下一批复习卡片。未提供 `size` 时由主进程策略给出默认值。 |
| `review:update` | Renderer → Main | `{ card_id: string, memory_level: MemoryLevel }` | `CardEntity` | 提交复习结果并回写记忆等级、复习次数、统计数据。 |
| `analytics:snapshot` | Renderer → Main | `void` | `ActivitySnapshot` | 拉取学习行为聚合数据，用于热力图与统计面板。 |

## 类型约束

- 顶层常量存放于 `src/shared/constants/app_channels.ts`，保证字符串枚举在多处引用时保持一致。
- `src/shared/ipc/contracts.ts` 为单一可信来源，定义了每个通道的 `request` / `response` 形态以及渲染层可调用的 `RendererApi`。
- 主进程 Handler 必须引用 `contracts.ts` 中的请求/响应类型，避免定义重复的局部 interface。
- 渲染层（包括 preload 与 React 代码）也需通过 `RendererApi` 获取类型提示，确保上下行契约一致。

## 错误处理

- 主进程在校验失败或持久化异常时应抛出错误，渲染进程通过 `ipcRenderer.invoke` 的 rejected Promise 接收。
- 错误消息需使用人类可读文本或封装的 `DomainError`，方便渲染层决定展示文案。
- 若对安全敏感的错误需遮蔽细节，请在主进程侧捕获并转换为通用描述。

## 扩展准则

1. 新增通道时：
   - 在 `app_channels.ts` 中追加常量。
   - 在 `contracts.ts` 补充 request/response 定义，并扩展 `RendererApi`.
   - 在主进程中注册对应 handler，直接引用契约类型。
   - 如渲染层需要同步 mock，更新 `renderer_process/utils/renderer_api.ts`。
   - 补充单元测试验证渲染层使用场景。
2. 修改现有契约时，需考虑向后兼容或同步调整所有调用方，避免出现类型漂移。
3. 对需要长期保留的破坏性修改，建议在 PR 中附带迁移策略，并在本文档记录注意事项。
