import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import keytar from 'keytar';

import type { ProviderConfig } from './ai';
import type { ProviderName, ProviderSettings, SafeProviderSettings } from '@shared/ipc';

const fsPromises = fs.promises;

export interface Keychain {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword?(service: string, account: string): Promise<boolean>;
}

interface ProviderSettingsStoreOptions {
  baseDir?: string;
  serviceName?: string;
  keychain?: Keychain;
}

type StoredProviderConfig = Omit<ProviderConfig, 'apiKey'>;

const ensureDir = async (dir: string) =>
  fsPromises.mkdir(dir, { recursive: true });

const buildTempPath = (filePath: string) => {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return path.join(dir, `${name}.${unique}.tmp`);
};

const safeWriteFile = async (filePath: string, data: string) => {
  const tempPath = buildTempPath(filePath);
  await ensureDir(path.dirname(filePath));
  try {
    await fsPromises.writeFile(tempPath, data, 'utf8');
    await fsPromises.rename(tempPath, filePath);
  } catch (error) {
    await fsPromises.unlink(tempPath).catch(() => {});
    throw error;
  }
};

const ensureNonEmptyString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} 必须是非空字符串`);
  }
  return value.trim();
};

export const normalizeProviderName = (value: unknown): ProviderName => {
  if (value === 'openai' || value === 'gemini' || value === 'mock') {
    return value;
  }
  throw new Error('provider 仅支持 openai/gemini/mock');
};

export const normalizePositiveInteger = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.floor(value);
};

export const normalizeProviderSettings = (
  settings: ProviderSettings,
): ProviderConfig => {
  const provider = normalizeProviderName(settings.provider);
  const model = settings.model?.trim() || undefined;
  const timeoutMs = normalizePositiveInteger(settings.timeoutMs);
  const maxOutputTokens = normalizePositiveInteger(settings.maxOutputTokens);
  const apiKey =
    provider === 'mock'
      ? undefined
      : ensureNonEmptyString(settings.apiKey, 'apiKey');

  return {
    provider,
    apiKey,
    model,
    timeoutMs,
    maxOutputTokens,
  };
};

export const toSafeProviderSettings = (
  config: ProviderConfig,
  hasKey?: boolean,
): SafeProviderSettings => ({
  provider: config.provider,
  model: config.model,
  timeoutMs: config.timeoutMs,
  maxOutputTokens: config.maxOutputTokens,
  hasKey: hasKey ?? Boolean(config.apiKey),
});

const safeNormalizeProvider = (value: unknown): ProviderName => {
  try {
    return normalizeProviderName(value);
  } catch {
    return 'mock';
  }
};

export class ProviderSettingsStore {
  private readonly baseDir: string;

  private readonly serviceName: string;

  private readonly keychain: Keychain;

  constructor(options: ProviderSettingsStoreOptions = {}) {
    this.baseDir = options.baseDir ?? app.getPath('userData');
    this.serviceName = options.serviceName ?? 'tango-card';
    this.keychain = options.keychain ?? keytar;
  }

  private get configPath() {
    return path.join(this.baseDir, 'provider-settings.json');
  }

  private accountName(provider: ProviderName) {
    return `ai-provider:${provider}`;
  }

  async load(): Promise<ProviderConfig> {
    const stored = await this.readConfigFile();
    const provider = safeNormalizeProvider(stored.provider);
    const model = stored.model?.trim() || undefined;
    const timeoutMs = normalizePositiveInteger(stored.timeoutMs);
    const maxOutputTokens = normalizePositiveInteger(stored.maxOutputTokens);
    const apiKey =
      provider === 'mock'
        ? undefined
        : (await this.keychain.getPassword(
            this.serviceName,
            this.accountName(provider),
          )) ?? undefined;

    return {
      provider,
      apiKey,
      model,
      timeoutMs,
      maxOutputTokens,
    };
  }

  async save(config: ProviderConfig): Promise<ProviderConfig> {
    const normalized: ProviderConfig = {
      provider: config.provider,
      apiKey: config.provider === 'mock' ? undefined : config.apiKey,
      model: config.model?.trim() || undefined,
      timeoutMs: normalizePositiveInteger(config.timeoutMs),
      maxOutputTokens: normalizePositiveInteger(config.maxOutputTokens),
    };

    const persisted: StoredProviderConfig = {
      provider: normalized.provider,
      model: normalized.model,
      timeoutMs: normalized.timeoutMs,
      maxOutputTokens: normalized.maxOutputTokens,
    };

    await safeWriteFile(this.configPath, `${JSON.stringify(persisted, null, 2)}\n`);

    if (normalized.provider === 'mock') {
      if (this.keychain.deletePassword) {
        await this.keychain.deletePassword(
          this.serviceName,
          this.accountName(normalized.provider),
        );
      }
      return normalized;
    }

    if (normalized.apiKey) {
      await this.keychain.setPassword(
        this.serviceName,
        this.accountName(normalized.provider),
        normalized.apiKey,
      );
    }

    return normalized;
  }

  async hasApiKey(provider: ProviderName): Promise<boolean> {
    if (provider === 'mock') {
      return false;
    }
    const stored = await this.keychain.getPassword(
      this.serviceName,
      this.accountName(provider),
    );
    return typeof stored === 'string' && stored.trim() !== '';
  }

  private async readConfigFile(): Promise<StoredProviderConfig> {
    try {
      const content = await fsPromises.readFile(this.configPath, 'utf8');
      if (content.trim() === '') {
        return { provider: 'mock' };
      }
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        return { provider: 'mock' };
      }
      return parsed as StoredProviderConfig;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return { provider: 'mock' };
      }
      console.warn('读取 provider 设置失败，使用默认 mock', error);
      return { provider: 'mock' };
    }
  }
}
