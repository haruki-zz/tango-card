# app/lib/api
- 封装网络与服务调用，如 Supabase 客户端、AI 代理请求。
- 暴露轻量函数供 features 层直接使用，统一错误与环境校验。
- `supabaseClient.ts`：读取并校验 Supabase 环境变量，创建 SDK 单例。
- `aiGenerator.ts`：调用 Edge Function `ai-generator` 生成卡片内容，支持模型参数、超时与回退到手动编辑。
