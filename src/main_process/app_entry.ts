import { app, BrowserWindow } from 'electron';
import { create_main_window } from './window_manager';
import { bootstrap_storage } from './service_bootstrap/storage_bootstrap';
import { load_runtime_settings, RuntimeSettings } from './service_bootstrap/settings_loader';
import { register_card_ingest_handler } from './ipc_handlers/card_ingest_handler';
import { register_review_session_handler } from './ipc_handlers/review_session_handler';
import { register_analytics_handler } from './ipc_handlers/analytics_handler';
import { register_card_backup_handler } from './ipc_handlers/card_backup_handler';

let cached_settings: RuntimeSettings | null = null;

async function initialize_main_process(): Promise<void> {
  cached_settings = await load_runtime_settings(app.getAppPath());
  const storage_context = await bootstrap_storage();

  register_card_ingest_handler(storage_context);
  register_review_session_handler(storage_context);
  register_analytics_handler(storage_context);
  register_card_backup_handler(storage_context);

  await create_main_window({ dev_tools_enabled: cached_settings.dev_tools_enabled });
}

app.whenReady().then(async () => {
  await initialize_main_process();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await create_main_window({ dev_tools_enabled: cached_settings?.dev_tools_enabled ?? false });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
