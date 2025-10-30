import { BrowserWindow, dialog, ipcMain } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import { writeFile, readFile } from 'node:fs/promises';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import type {
  CardExportRequest,
  CardExportResponse,
  CardImportResponse,
} from '../../shared/ipc/contracts';
import {
  apply_backup_payload,
  collect_backup_snapshot,
  infer_backup_format,
  parse_backup_buffer,
  serialize_backup_payload,
  type BackupFormat,
} from '../../infrastructure/persistence/card_backup_service';

export function register_card_backup_handler(storage_context: StorageContext): void {
  ipcMain.handle(
    APP_CHANNELS.CARD_EXPORT,
    async (_event, request: CardExportRequest): Promise<CardExportResponse> => {
      try {
        const format: BackupFormat = request.format === 'zip' ? 'zip' : 'json';
        const browser_window = BrowserWindow.getFocusedWindow();
        const save_options: SaveDialogOptions = {
          title: 'Export Cards',
          defaultPath: `tango-card-backup.${format}`,
          filters: format === 'zip'
            ? [{ name: 'ZIP backup', extensions: ['zip'] }]
            : [{ name: 'JSON backup', extensions: ['json'] }],
        };
        const { canceled, filePath } = browser_window
          ? await dialog.showSaveDialog(browser_window, save_options)
          : await dialog.showSaveDialog(save_options);
        if (canceled || !filePath) {
          return { status: 'cancelled' };
        }

        const payload = await collect_backup_snapshot({
          card_repository: storage_context.card_repository,
          review_session_repository: storage_context.review_session_repository,
          analytics_tracker: storage_context.analytics_tracker,
        });
        const buffer = await serialize_backup_payload(payload, format);
        await writeFile(filePath, buffer);

        return {
          status: 'success',
          file_path: filePath,
          exported_cards: payload.cards.length,
          exported_sessions: payload.review_sessions.length,
        };
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Export failed.',
        };
      }
    },
  );

  ipcMain.handle(APP_CHANNELS.CARD_IMPORT, async (): Promise<CardImportResponse> => {
    try {
      const browser_window = BrowserWindow.getFocusedWindow();
      const open_options: OpenDialogOptions = {
        title: 'Import Cards',
        filters: [{ name: 'Backup files', extensions: ['json', 'zip'] }],
        properties: ['openFile'],
      };
      const { canceled, filePaths } = browser_window
        ? await dialog.showOpenDialog(browser_window, open_options)
        : await dialog.showOpenDialog(open_options);
      if (canceled || !filePaths || filePaths.length === 0) {
        return { status: 'cancelled' };
      }
      const file_path = filePaths[0];
      const buffer = await readFile(file_path);
      const format = infer_backup_format(file_path, buffer);
      const payload = await parse_backup_buffer(buffer, format);
      await apply_backup_payload(
        {
          card_repository: storage_context.card_repository,
          review_session_repository: storage_context.review_session_repository,
          analytics_tracker: storage_context.analytics_tracker,
        },
        payload,
      );

      return {
        status: 'success',
        file_path,
        imported_cards: payload.cards.length,
        imported_sessions: payload.review_sessions.length,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Import failed.',
      };
    }
  });
}
