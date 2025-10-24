import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import type { AnalyticsSnapshotResponse } from '../../shared/ipc/contracts';

export function register_analytics_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.ANALYTICS_SNAPSHOT, async (): Promise<AnalyticsSnapshotResponse> => {
    return storage_context.analytics_tracker.load_snapshot();
  });
}
