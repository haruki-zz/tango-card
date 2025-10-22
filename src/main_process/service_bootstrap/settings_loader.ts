import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface RuntimeSettings {
  readonly dev_tools_enabled: boolean;
}

const SETTINGS_FILE_NAME = 'app.settings.json';

export async function load_runtime_settings(project_root: string): Promise<RuntimeSettings> {
  const fallback: RuntimeSettings = {
    dev_tools_enabled: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
  };

  const settings_path = join(project_root, 'config', SETTINGS_FILE_NAME);
  if (!existsSync(settings_path)) {
    return fallback;
  }

  try {
    const content = await readFile(settings_path, 'utf-8');
    const parsed = JSON.parse(content) as Partial<RuntimeSettings>;
    return {
      dev_tools_enabled:
        typeof parsed.dev_tools_enabled === 'boolean'
          ? parsed.dev_tools_enabled
          : fallback.dev_tools_enabled,
    };
  } catch {
    return fallback;
  }
}
