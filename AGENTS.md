# Repository Guidelines
Contributor quick-start for the Electron + React/Vite Japanese vocabulary app. Keep changes small, typed, and testable.

## Critical Pre-Read
- Always read `prompts/@coding-style.md` before writing any code.
- Always read `prompts/@system-prompt.md` before writing any code.
- Always read `memory-bank/@architecture.md` before writing any code.
- Always read `memory-bank/@game-design-document.md` before writing any code.
- After adding a major feature or completing a milestone, update `memory-bank/@architecture.md`.

## Project Structure & Module Organization
- `src/main`: Electron main process (IPC, filesystem, LLM calls). Keep persistent paths under `app.getPath('userData')` using `words.jsonl`, `reviews.jsonl`, and `activity.json`.
- `src/renderer`: React/Vite + TypeScript UI (word entry, review queue with SM-2, activity heatmap). Use Zustand for state and Tailwind for styling.
- `src/shared`: Reusable types, SM-2 helpers, and data parsing; keep them framework-agnostic for testing.
- `public/`: Static assets; avoid embedding secrets. Packaging configuration lives with Electron builder config (e.g., `electron-builder.yml`/`electron.vite.config.ts`).

## Build, Test, and Development Commands
- `npm install`: Restore dependencies.
- `npm run dev`: Start Vite renderer + Electron in watch mode for local development.
- `npm run build`: Production bundles for main and renderer.
- `npm run lint`: ESLint + Prettier checks; fix formatting before commits.
- `npm test` (or `npm test -- --coverage`): Vitest + React Testing Library. Add `npm run test:e2e` if Playwright is configured.
- `npm run pack`: Electron Builder packaging (dmg/zip for macOS, nsis/portable for Windows).

## Coding Style & Naming Conventions
- TypeScript everywhere; prefer functional components and hooks. Components: PascalCase `.tsx`; hooks: `useX.ts`; utility modules: `kebab-case.ts`.
- Keep renderer logic pure where possible; isolate side effects in main/IPC adapters.
- Rely on Prettier defaults (2-space indent, semicolons). Tailwind classes stay sorted by layout → spacing → color for readability.
- Keep text and time values in UTC ISO strings (`YYYY-MM-DDTHH:mm:ssZ`), matching stored JSON.

## Testing Guidelines
- Place unit tests alongside code as `*.test.ts(x)` or in `__tests__/`. Mock IPC/LLM boundaries; keep SM-2 math deterministic with fake timers.
- Cover parsing/writing of JSONL files, queue generation, and UI card flip/review flows. Target ≥80% coverage and include regression cases for previously fixed bugs.
- For Playwright e2e, test the add-word → review flow and activity grid rendering using local fixtures (no network keys).

## Commit & Pull Request Guidelines
- History is clean; use Conventional Commits (`feat:`, `fix:`, `chore:`) with imperative subjects. Reference design-document sections when relevant.
- PRs should include: clear summary, linked issue (if any), screenshots/GIFs for UI changes, and test evidence (`npm test`, `npm run lint`, packaging if touched).
- Call out data migrations or changes to stored file shapes; provide backfill/migration steps when needed.

## Security & Configuration Tips
- Never commit API keys; load them via environment or system keychain access from the main process. Do not echo keys over IPC.
- When writing user data, use temp-file-then-rename to avoid corruption and keep files human-readable. Avoid adding telemetry; data stays local by default.
