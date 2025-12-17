# app/features/review
- 复习流程与卡片翻转交互的页面与逻辑所在，围绕记忆卡片和熟悉度标记展开。
- `services/reviewQueue.ts`：按不熟:熟悉=2:1 权重随机抽样（默认 30 条），不足互补；提供 `prepareReviewQueue` 读库并写入 store。
- `services/reviewActions.ts`：封装熟悉/不熟/跳过动作，统一更新词条熟悉度、reviewCount/lastReviewedAt、写入 ReviewEvent 与活跃度日志并入同步队列。
- `components/ReviewSession.tsx`：复习会话组件，挂载 WordCard，要求先翻面再标记，支持跳过/重置，空队列提示。
- `__tests__/`：覆盖队列抽样、复习流程、重置不计数的集成行为。
