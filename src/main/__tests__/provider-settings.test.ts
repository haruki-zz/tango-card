import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { ProviderSettingsStore } from '../provider-settings';

const createTempDir = async () =>
  fs.promises.mkdtemp(path.join(os.tmpdir(), 'provider-store-'));

const createKeychainMock = () => {
  const entries = new Map<string, string>();
  return {
    getPassword: vi.fn(async (_service: string, account: string) =>
      entries.has(account) ? entries.get(account) ?? null : null,
    ),
    setPassword: vi.fn(
      async (_service: string, account: string, password: string) => {
        entries.set(account, password);
      },
    ),
    deletePassword: vi.fn(async (_service: string, account: string) =>
      entries.delete(account),
    ),
  };
};

describe('ProviderSettingsStore', () => {
  it('默认返回 mock provider 且不触碰密钥存储', async () => {
    const baseDir = await createTempDir();
    const keychain = createKeychainMock();
    const store = new ProviderSettingsStore({ baseDir, keychain });

    const config = await store.load();

    expect(config.provider).toBe('mock');
    expect(config.apiKey).toBeUndefined();
    expect(keychain.getPassword).not.toHaveBeenCalled();
  });

  it('写入 provider 配置时仅将密钥保存到 keychain', async () => {
    const baseDir = await createTempDir();
    const keychain = createKeychainMock();
    const store = new ProviderSettingsStore({
      baseDir,
      keychain,
      serviceName: 'settings-test',
    });

    const saved = await store.save({
      provider: 'openai',
      apiKey: 'sk-test-123',
      model: 'gpt-4.1-mini',
      timeoutMs: 20_000,
    });

    expect(saved.provider).toBe('openai');
    expect(saved.apiKey).toBe('sk-test-123');
    expect(keychain.setPassword).toHaveBeenCalledWith(
      'settings-test',
      'ai-provider:openai',
      'sk-test-123',
    );

    const persisted = await fs.promises.readFile(
      path.join(baseDir, 'provider-settings.json'),
      'utf8',
    );
    expect(persisted).toContain('"provider": "openai"');
    expect(persisted).toContain('"model": "gpt-4.1-mini"');
    expect(persisted).not.toContain('sk-test-123');
  });

  it('hasApiKey 仅在真实保存密钥后返回 true', async () => {
    const baseDir = await createTempDir();
    const keychain = createKeychainMock();
    const store = new ProviderSettingsStore({ baseDir, keychain });

    await store.save({ provider: 'gemini', apiKey: 'gk-test' });

    expect(await store.hasApiKey('gemini')).toBe(true);
    expect(await store.hasApiKey('mock')).toBe(false);
  });
});
