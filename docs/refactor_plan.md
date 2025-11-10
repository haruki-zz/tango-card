## Refactor Plan: Focus on Core Flashcard Flow

### Goals
1. **Retain only core features**
   - Card authoring (create + edit stored words)
   - Review queue (select subset of existing cards for spaced practice)
2. **Remove auxiliary surfaces**
   - Analytics visualizations, settings/backup flows, card search dashboards, featured widgets, etc.
3. **Simplify renderer UI**
   - Single-screen entry point with two primary actions: add card, start review.
   - Streamlined layouts for editor and review; no decorative chrome.

### High-Level Steps
1. **Prune Routes & Screens**
   - Remove analytics, settings, home dashboard widgets, other unused screens/components.
   - Update `AppRouter` to expose only two screens: editor and review (plus minimal landing toggle if needed).

2. **Trim State / Services**
   - Delete analytics builders, heatmap logic, search suggestions, featured-card helpers.
   - Ensure remaining hooks (`use_card_store`, `use_review_cycle`) no longer depend on removed modules.

3. **Redesign UI**
   - Replace home/dashboard with a minimalist hub: short description, two CTA buttons linking to editor or review.
   - Keep editor + review layouts utilitarian (form + preview, review queue controls).

4. **Clean Assets & Docs**
   - Remove obsolete components, assets, tests tied to dropped functionality.
   - Update docs (`README`, TODO) after code refactor to describe lean feature set.

5. **Validation**
   - `npm run lint`
   - Minimal smoke test: create card, confirm review session operates with trimmed UI.

### Open Questions
- Do we keep card search? (Default assumption: no, unless required for review flow.)
- Persistence schema unaffected? (Yes; only renderer/UI changes.)
