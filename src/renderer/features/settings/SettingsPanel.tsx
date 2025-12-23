import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '../../../shared/apiTypes';

type FormState = {
  apiKey: string;
  preferredModel: AppSettings['preferredModel'];
  reviewBatchSize: number;
  theme: AppSettings['theme'];
};

const MODEL_OPTIONS: { value: AppSettings['preferredModel']; label: string; hint: string }[] = [
  { value: 'gemini-flash-2.5-lite', label: 'Gemini Flash 2.5 Lite', hint: '默认模型，速度快、成本低' },
  { value: 'gpt-4o', label: 'GPT-4o', hint: '更强的理解与生成能力' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', hint: '轻量模型，语义可靠' }
];

const THEME_OPTIONS: { value: AppSettings['theme']; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' }
];

const DEFAULT_FORM: FormState = {
  apiKey: '',
  preferredModel: 'gemini-flash-2.5-lite',
  reviewBatchSize: 1,
  theme: 'light'
};

export function SettingsPanel() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedModel = useMemo(
    () => MODEL_OPTIONS.find((item) => item.value === form.preferredModel) ?? MODEL_OPTIONS[0],
    [form.preferredModel]
  );

  const loadSettings = useCallback(async () => {
    if (!window.api?.settings?.getSettings) {
      setError('设置通道不可用，请检查预加载 IPC 配置。');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const settings = await window.api.settings.getSettings();
      setForm({
        apiKey: settings.apiKey ?? '',
        preferredModel: settings.preferredModel,
        reviewBatchSize: settings.reviewBatchSize,
        theme: settings.theme
      });
      setMessage('已读取本地设置。');
    } catch (err) {
      setError(extractMessage(err, '加载设置失败，请稍后再试。'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!window.api?.settings?.updateSettings) {
      setError('设置通道不可用，请检查预加载 IPC 配置。');
      return;
    }

    const payload: Partial<AppSettings> = {
      apiKey: form.apiKey.trim() ? form.apiKey.trim() : null,
      preferredModel: form.preferredModel,
      reviewBatchSize: Math.max(1, Math.floor(form.reviewBatchSize || 1)),
      theme: form.theme
    };

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await window.api.settings.updateSettings(payload);
      setForm({
        apiKey: updated.apiKey ?? '',
        preferredModel: updated.preferredModel,
        reviewBatchSize: updated.reviewBatchSize,
        theme: updated.theme
      });
      setMessage('已保存到本地数据库，重启后仍然有效。');
    } catch (err) {
      setError(extractMessage(err, '保存失败，请稍后再试。'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel settings-panel">
      <div className="settings-header">
        <div>
          <p className="eyebrow">设置</p>
          <h3>配置 API、主题与复习偏好</h3>
          <p className="muted">
            API Key 与模型用于调用 AI 生成读音/例句，批次大小与主题则影响复习体验。所有配置均保存在本地 SQLite。
          </p>
        </div>
        <div className="status-stack">
          <span className="badge">步骤 11 / 设置</span>
          {saving ? <span className="badge info">保存中</span> : null}
          {loading ? <span className="badge info">加载中</span> : null}
        </div>
      </div>

      <div className="settings-grid">
        <div className="field">
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="password"
            placeholder="仅保存在本地，留空则不调用 AI"
            value={form.apiKey}
            onChange={(event) => setForm((prev) => ({ ...prev, apiKey: event.target.value }))}
            disabled={saving || loading}
            autoComplete="off"
          />
          <p className="muted small">支持 OpenAI 兼容或 Gemini Key，保存后可直接生成单词数据。</p>
        </div>

        <div className="field">
          <label htmlFor="preferredModel">AI 模型</label>
          <select
            id="preferredModel"
            value={form.preferredModel}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                preferredModel: event.target.value as AppSettings['preferredModel']
              }))
            }
            disabled={saving || loading}
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="muted small">{selectedModel.hint}</p>
        </div>

        <div className="field">
          <label htmlFor="batchSize">每次复习批次大小</label>
          <input
            id="batchSize"
            type="number"
            min={1}
            value={form.reviewBatchSize}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                reviewBatchSize: Number(event.target.value)
              }))
            }
            disabled={saving || loading}
          />
          <p className="muted small">默认 1，可在后续复习体验中逐步调大。</p>
        </div>

        <div className="field">
          <div className="field-header">
            <label>主题</label>
            <span className="muted small">light / dark / system</span>
          </div>
          <div className="toggle-group">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`toggle ${form.theme === option.value ? 'is-active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, theme: option.value }))}
                disabled={saving || loading}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="muted small">主题会在后续 UI 迭代时统一接入。</p>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? '保存中...' : '保存设置'}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={loadSettings}
          disabled={saving}
        >
          重新读取
        </button>
      </div>

      <div className="status-row" role="status">
        {error ? <span className="badge error">{error}</span> : null}
        {message ? <span className="badge success">{message}</span> : null}
        {!error && !message ? <span className="muted small">保存成功后重启也会保留配置。</span> : null}
      </div>
    </section>
  );
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
