import type { ReviewSessionRecord, StorageDriver } from './storage_driver';

export class ReviewSessionRepository {
  private readonly storage_driver: StorageDriver;

  constructor(storage_driver: StorageDriver) {
    this.storage_driver = storage_driver;
  }

  async list_sessions(): Promise<ReviewSessionRecord[]> {
    return this.storage_driver.read_review_sessions();
  }

  async append_session(record: ReviewSessionRecord): Promise<void> {
    const sessions = await this.storage_driver.read_review_sessions();
    sessions.push(record);
    await this.storage_driver.write_review_sessions(sessions);
  }
}
