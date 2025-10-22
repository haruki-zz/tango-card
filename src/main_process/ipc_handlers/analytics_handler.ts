import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';

export function register_analytics_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.ANALYTICS_SNAPSHOT, async () => {
    return storage_context.analytics_tracker.load_snapshot();
  });
}
