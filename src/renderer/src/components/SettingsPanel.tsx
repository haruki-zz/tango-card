import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type { ProviderName } from '@shared/ipc';

import { useAppStore } from '../store/useAppStore';

type FormStatus = 'idle' | 'saving';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return '保存失败，请稍后重试';
};

const providerOptions: { value: ProviderName; label: string; hint: string }[] =
  [
    { value: 'openai', label: 'OpenAI', hint: '需要有效的 API Key' },
    { value: 'gemini', label: 'Gemini', hint: '使用 Google Gemini 密钥' },
    {
      value: 'mock',
      label: 'Mock（测试）',
      hint: '离线固定响应，便于测试与演示',
    },
  ];

const SettingsPanel = () => {
  const provider = useAppStore((state) => state.provider);
  const saveProvider = useAppStore((state) => state.setProvider);

  const [selectedProvider, setSelectedProvider] =
    useState<ProviderName>('mock');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider?.provider) {
      setSelectedProvider(provider.provider);
    }
  }, [provider]);

  const needsKey = selectedProvider !== 'mock';
  const isSaving = status === 'saving';

  const savedHint = useMemo(() => {
    if (selectedProvider === 'mock') {
      return 'Mock 提供固定响应，无需密钥即可使用。';
    }
    if (provider?.provider === selectedProvider && provider.hasKey) {
      return '已检测到保存的密钥，重启后依然可用。';
    }
    return '未检测到密钥，请填写后保存。';
  }, [provider, selectedProvider]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedKey = apiKey.trim();
    if (needsKey && !trimmedKey) {
      setError('请选择 provider 并填写密钥后再保存');
      return;
    }

    setStatus('saving');
    try {
      const saved = await saveProvider({
        provider: selectedProvider,
        apiKey: needsKey ? trimmedKey : undefined,
      });
      setMessage('设置已保存，密钥仅存于系统安全存储');
      setSelectedProvider(saved.provider);
      setApiKey('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStatus('idle');
    }
  };

  return (
    <form className="surface-card" onSubmit={handleSubmit} aria-label="LLM 设置">
      <div className="flex flex-col gap-2">
        <span className="pill w-fit">设置</span>
        <h2 className="text-xl font-semibold text-ink">LLM 提供商与密钥</h2>
        <p className="text-sm text-muted">
          选择使用的模型并输入密钥，密钥仅写入系统钥匙串，不会在界面回显。
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Provider</span>
          <select
            aria-label="LLM 提供商"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent-200 ring-offset-1 transition focus:ring-2 disabled:opacity-60"
            value={selectedProvider}
            onChange={(event) =>
              setSelectedProvider(event.target.value as ProviderName)
            }
            disabled={isSaving}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">
            {providerOptions.find((item) => item.value === selectedProvider)
              ?.hint ?? ''}
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">API 密钥</span>
          <input
            aria-label="API 密钥"
            type="password"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent-200 ring-offset-1 transition focus:ring-2 disabled:opacity-60"
            placeholder={
              needsKey ? 'sk-...' : 'mock 模式无需密钥，留空即可'
            }
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            disabled={isSaving || !needsKey}
          />
          <span className="text-xs text-muted">{savedHint}</span>
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? '保存中…' : '保存设置'}
        </button>
        {message ? (
          <span className="text-sm font-medium text-emerald-700">
            {message}
          </span>
        ) : null}
        {error ? (
          <span className="text-sm font-medium text-red-600">{error}</span>
        ) : null}
      </div>
    </form>
  );
};

export default SettingsPanel;
