## Refactor Plan: Focus on Core Flashcard Flow

### Goals
1. **Retain only core features**
   - Card authoring (create + edit stored words)
   - Review queue (select subset of existing cards for spaced practice, weighted by familiarity)
   - Lightweight activity visualization（全年热力图）
2. **Remove auxiliary surfaces**
   - Analytics visualizations, settings/backup flows, card search dashboards, featured widgets, etc.
3. **Simplify renderer UI**
   - Single-screen entry point with two primary actions: add card, start review.
   - Streamlined layouts for editor and review; no decorative chrome.

### High-Level Steps
1. **Prune Routes & Screens**
   - Remove analytics、复杂 dashboard，保留 Hub + Editor + Review。
   - Update `AppRouter` to expose only two screens: editor and review (plus minimal landing toggle if needed).

2. **Trim State / Services**
   - Delete旧 analytics/search 逻辑。
   - 保留 `use_card_store`（含全年活跃度聚合）与 `use_review_cycle`（含熟悉度加权与标记）。

3. **Redesign UI**
   - Hub：双 CTA + 状态板 + 全年热力图（月分区 + 空列分隔，15px 方格），主题切换。
   - Editor / Review：保持表单 + 预览、复习队列、熟悉度标记与快捷键。

4. **Clean Assets & Docs**
   - 移除废弃组件/资产/测试，更新 README/TODO/架构文档描述当前主题、热力图与快捷键。

5. **Validation**
   - `npm run lint`
   - Minimal smoke test: create card, confirm review session operates with trimmed UI.

### Open Questions
- Do we keep card search? (Default assumption: no, unless required for review flow.)
- Persistence schema unaffected? (Yes; only renderer/UI changes.)
