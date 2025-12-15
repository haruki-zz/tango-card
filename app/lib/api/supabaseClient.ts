import {
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";

import { SUPABASE_ENV_KEYS } from "../constants";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const readEnvValue = (key: string): string => {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    throw new Error(
      `环境变量 ${key} 不能为空，请在 .env 中配置 Supabase 连接信息`,
    );
  }

  return value.trim();
};

const validateUrl = (value: string, key: string): string => {
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`环境变量 ${key} 需要合法的 URL`);
  }
};

export const loadSupabaseConfig = (): SupabaseConfig => {
  const rawUrl = readEnvValue(SUPABASE_ENV_KEYS.url);
  const anonKey = readEnvValue(SUPABASE_ENV_KEYS.anonKey);
  const url = validateUrl(rawUrl, SUPABASE_ENV_KEYS.url);

  return { url, anonKey };
};

let client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (client) {
    return client;
  }

  const { url, anonKey } = loadSupabaseConfig();
  client = createClient(url, anonKey);

  return client;
};

export const supabaseClient = getSupabaseClient();
