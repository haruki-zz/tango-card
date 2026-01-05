import { useRef, useState, type ChangeEvent } from 'react';

import type { ImportFormat } from '@shared/ipc';

import { useAppStore } from '../store/useAppStore';

type BusyState = 'idle' | 'importing' | 'exporting';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return '发生未知错误，请重试';
};

const resolveFormat = (fileName: string): ImportFormat | null => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jsonl')) {
    return 'jsonl';
  }
  if (lower.endsWith('.json')) {
    return 'json';
  }
  return null;
};

const ImportExportPanel = () => {
  const importData = useAppStore((state) => state.importData);
  const exportData = useAppStore((state) => state.exportData);

  const [status, setStatus] = useState<BusyState>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isImporting = status === 'importing';
  const isExporting = status === 'exporting';
  const isBusy = status !== 'idle';

  const handleImport = async (file: File) => {
    const format = resolveFormat(file.name);
    if (!format) {
      setError('仅支持 .json 或 .jsonl 文件导入');
      setMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setStatus('importing');
    setMessage('');
    setError('');
    try {
      const content = await file.text();
      const result = await importData({ content, format });
      setMessage(
        `导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条。重复词条将按最新内容覆盖。`,
      );
    } catch (err) {
      setError(`导入失败：${getErrorMessage(err)}`);
    } finally {
      setStatus('idle');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await handleImport(file);
  };

  const handleExport = async () => {
    setStatus('exporting');
    setMessage('');
    setError('');
    try {
      const result = await exportData();
      setMessage(
        `已导出 ${result.count} 条词条，JSON 位于 ${result.jsonPath}，CSV 位于 ${result.csvPath}。`,
      );
    } catch (err) {
      setError(`导出失败：${getErrorMessage(err)}`);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section className="surface-card" aria-label="数据导入导出">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="pill w-fit">导入 / 导出</span>
          <h2 className="text-xl font-semibold text-ink">迁移与备份数据</h2>
          <p className="text-sm text-muted">
            支持 JSON/JSONL 导入，导出会同时生成 JSON 与 CSV。重复词条会用最新数据覆盖。
          </p>
        </div>
        <div className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-right text-xs text-muted shadow-inner">
          <p>导入会校验字段并跳过非法记录</p>
          <p className="mt-1">导出文件保存在应用数据目录的 exports/</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                导入
              </span>
              <span className="text-sm font-semibold text-ink">选择 JSON / JSONL 文件</span>
            </div>
            <span className="rounded-full border border-dashed border-accent-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-800">
              {isImporting ? '导入中…' : '已就绪'}
            </span>
          </div>
          <label
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-accent-200 bg-accent-50 px-3 py-2 text-sm font-semibold text-accent-800 shadow-sm transition hover:border-accent-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
            aria-disabled={isBusy}
            onClick={(event) => {
              if (isBusy) {
                event.preventDefault();
              }
            }}
            onKeyDown={(event) => {
              if (isBusy) {
                return;
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <span>选择文件</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonl,application/json"
              className="hidden"
              aria-label="选择导入文件"
              onChange={handleFileChange}
              disabled={isBusy}
            />
            <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-accent-700 shadow-inner">
              JSON / JSONL
            </span>
          </label>
          <p className="text-xs text-muted">
            读取完成后会立即导入并刷新词库，格式错误或重复记录会提示跳过。
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                导出
              </span>
              <span className="text-sm font-semibold text-ink">生成 JSON + CSV 备份</span>
            </div>
            <span className="rounded-full border border-dashed border-accent-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-800">
              {isExporting ? '导出中…' : '已就绪'}
            </span>
          </div>
          <button
            type="button"
            className="btn"
            onClick={handleExport}
            disabled={isBusy}
          >
            {isExporting ? '导出中…' : '导出数据'}
          </button>
          <p className="text-xs text-muted">导出会统计当前词库总数并返回保存路径。</p>
        </div>
      </div>

      <div className="mt-4 space-y-2" aria-live="polite">
        {message ? (
          <div className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-sm font-semibold text-accent-800 shadow-inner">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-inner">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ImportExportPanel;
