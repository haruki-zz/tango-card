import type { StorageDriver } from './storage_driver';

export interface StorageEngine<TConfig = unknown> {
  readonly type: string;
  create_driver(config: TConfig): Promise<StorageDriver>;
}

export interface StorageEngineConfig<TOptions = Record<string, unknown>> {
  readonly type: string;
  readonly options: TOptions;
}

type AnyStorageEngine = StorageEngine<unknown>;

const storage_engine_registry = new Map<string, AnyStorageEngine>();

export function register_storage_engine(engine: AnyStorageEngine): void {
  if (storage_engine_registry.has(engine.type)) {
    throw new Error(`Storage engine "${engine.type}" is already registered.`);
  }
  storage_engine_registry.set(engine.type, engine);
}

export function is_storage_engine_registered(type: string): boolean {
  return storage_engine_registry.has(type);
}

export async function create_storage_driver<TOptions>(
  config: StorageEngineConfig<TOptions>,
): Promise<StorageDriver> {
  const engine = storage_engine_registry.get(config.type);
  if (!engine) {
    throw new Error(`Storage engine "${config.type}" is not registered.`);
  }
  return engine.create_driver(config.options);
}
