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
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }}>
      <header>
        <h2>Settings</h2>
        <p>More configuration options are coming soon.</p>
      </header>
      <article>
        <h3>Basics</h3>
        <ul>
          <li>Data directory: Electron userData/tango-card</li>
          <li>Default memory weights: Well Known 1, Somewhat Familiar 3, Needs Reinforcement 5</li>
          <li>SVG safety: removes script/foreignObject tags before saving</li>
        </ul>
      </article>
      <article style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3>Backup & Migration</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          Exports include cards, review history, and analytics (JSON or ZIP). Imports overwrite existing data, so back up first.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handle_export('json')}
            disabled={is_busy}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              cursor: is_busy ? 'not-allowed' : 'pointer',
            }}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => handle_export('zip')}
            disabled={is_busy}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              cursor: is_busy ? 'not-allowed' : 'pointer',
            }}
          >
            Export ZIP
          </button>
          <button
            type="button"
            onClick={handle_import}
            disabled={is_busy}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid #22c55e',
              backgroundColor: '#22c55e',
              color: '#0f172a',
              cursor: is_busy ? 'not-allowed' : 'pointer',
            }}
          >
            Import Backup
          </button>
        </div>
        <p aria-live="polite" style={{ minHeight: '1.5rem', margin: 0, color: '#94a3b8' }}>
          {is_busy ? 'Processing...' : operation_message}
        </p>
      </article>
    </section>
  );
}
