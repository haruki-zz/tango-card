import { FileStorageProvider } from '../../storage_providers/file_storage_provider';
import { register_storage_engine, type StorageEngine } from '../storage_engine';
import type { StorageDriver } from '../storage_driver';

export interface FileStorageEngineOptions {
  readonly base_path: string;
}

class FileStorageEngine implements StorageEngine<FileStorageEngineOptions> {
  readonly type = 'file';

  async create_driver(config: FileStorageEngineOptions): Promise<StorageDriver> {
    return new FileStorageProvider(config.base_path);
  }
}

register_storage_engine(new FileStorageEngine());
