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
        set_operation_message('已取消导出操作。');
        return;
      }
      if (result.status === 'error') {
        set_operation_message(result.message ?? '导出失败，稍后再试。');
        return;
      }
      const summary = [
        `成功导出 ${result.exported_cards ?? 0} 张卡片`,
        result.exported_sessions !== undefined
          ? `复习记录 ${result.exported_sessions ?? 0} 条`
          : null,
        result.file_path ? `位置：${result.file_path}` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join('，');
      set_operation_message(summary || '导出成功。');
    } catch (error) {
      set_operation_message(error instanceof Error ? error.message : '导出失败，稍后再试。');
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
        set_operation_message('已取消导入操作。');
        return;
      }
      if (result.status === 'error') {
        set_operation_message(result.message ?? '导入失败，稍后再试。');
        return;
      }
      const summary = [
        `成功导入 ${result.imported_cards ?? 0} 张卡片`,
        result.imported_sessions !== undefined
          ? `复习记录 ${result.imported_sessions ?? 0} 条`
          : null,
        '为确保数据刷新，可在必要时重新打开应用。',
      ]
        .filter((value): value is string => Boolean(value))
        .join('，');
      set_operation_message(summary);
    } catch (error) {
      set_operation_message(error instanceof Error ? error.message : '导入失败，稍后再试。');
    } finally {
      set_pending_action(null);
    }
  }, []);

  const is_busy = pending_action !== null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }}>
      <header>
        <h2>设置</h2>
        <p>更多配置选项将在后续版本开放。</p>
      </header>
      <article>
        <h3>基础信息</h3>
        <ul>
          <li>数据目录：Electron userData/tango-card</li>
          <li>默认记忆权重：熟知 1，不太熟 3，需要强化 5</li>
          <li>SVG 安全：保存前会自动移除 script/foreignObject 标签</li>
        </ul>
      </article>
      <article style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3>数据备份与迁移</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          导出操作会包含卡片、复习记录与学习统计，可保存为 JSON/ZIP；导入会覆写当前数据，请先备份。
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
            导出 JSON
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
            导出 ZIP
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
            导入备份
          </button>
        </div>
        <p aria-live="polite" style={{ minHeight: '1.5rem', margin: 0, color: '#94a3b8' }}>
          {is_busy ? '处理中...' : operation_message}
        </p>
      </article>
    </section>
  );
}
