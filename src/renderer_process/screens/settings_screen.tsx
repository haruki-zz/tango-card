import { useCallback, useState } from 'react';
import { get_renderer_api } from '../utils/renderer_api';

type PendingAction = 'export:json' | 'export:zip' | 'import' | null;

export function SettingsScreen() {
  const [pending_action, set_pending_action] = useState<PendingAction>(null);
  const [operation_message, set_operation_message] = useState<string | null>(null);

  const handle_export = useCallback(async (format: 'json' | 'zip') => {
    set_pending_action(format === 'zip' ? 'export:zip' : 'export:json');
    set_operation_message(null);
    try {
      const result = await get_renderer_api().export_cards({ format });
      if (result.status === 'cancelled') {
        set_operation_message('Export cancelled.');
        return;
      }
      if (result.status === 'error') {
        set_operation_message(result.message ?? 'Export failed; please try again later.');
        return;
      }
      const summary = [
        `Exported ${result.exported_cards ?? 0} cards`,
        result.exported_sessions !== undefined ? `Review sessions: ${result.exported_sessions ?? 0}` : null,
        result.file_path ? `Saved to: ${result.file_path}` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join(', ');
      set_operation_message(summary || 'Export completed.');
    } catch (error) {
      set_operation_message(error instanceof Error ? error.message : 'Export failed; please try again later.');
    } finally {
      set_pending_action(null);
    }
  }, []);

  const handle_import = useCallback(async () => {
    set_pending_action('import');
    set_operation_message(null);
    try {
      const result = await get_renderer_api().import_cards();
      if (result.status === 'cancelled') {
        set_operation_message('Import cancelled.');
        return;
      }
      if (result.status === 'error') {
        set_operation_message(result.message ?? 'Import failed; please try again later.');
        return;
      }
      const summary = [
        `Imported ${result.imported_cards ?? 0} cards`,
        result.imported_sessions !== undefined ? `Review sessions: ${result.imported_sessions ?? 0}` : null,
        'If updates do not appear, restart the app.',
      ]
        .filter((value): value is string => Boolean(value))
        .join(', ');
      set_operation_message(summary);
    } catch (error) {
      set_operation_message(error instanceof Error ? error.message : 'Import failed; please try again later.');
    } finally {
      set_pending_action(null);
    }
  }, []);

  const is_busy = pending_action !== null;

  return (
    <section className="flex max-w-3xl flex-col gap-6 text-white">
      <header className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(2,6,23,0.55)]">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/60">Settings</p>
        <h2 className="mt-3 text-3xl font-semibold">Control backups and data safety</h2>
        <p className="mt-2 text-sm text-white/70">More configuration options are coming soon.</p>
      </header>
      <article className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold">Basics</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
          <li>Data directory: Electron userData/tango-card</li>
          <li>Default memory weights: Well Known 1, Somewhat Familiar 3, Needs Reinforcement 5</li>
          <li>SVG sanitizer strips script/foreignObject tags before saving</li>
        </ul>
      </article>
      <article className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold">Backup &amp; migration</h3>
        <p className="mt-2 text-sm text-white/70">
          Exports include cards, review history, and analytics data. Imports overwrite existing data—always back up first.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handle_export('json')}
            disabled={is_busy}
            className="rounded-[999px] border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => handle_export('zip')}
            disabled={is_busy}
            className="rounded-[999px] border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export ZIP
          </button>
          <button
            type="button"
            onClick={handle_import}
            disabled={is_busy}
            className="rounded-[999px] border border-emerald-300/60 bg-emerald-400/80 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Import backup
          </button>
        </div>
        <p aria-live="polite" className="mt-3 min-h-[1.5rem] text-sm text-white/70">
          {is_busy ? 'Processing...' : operation_message ?? ''}
        </p>
      </article>
    </section>
  );
}
