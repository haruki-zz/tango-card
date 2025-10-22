import { BrowserWindow, app } from 'electron';
import { join } from 'node:path';

interface MainWindowOptions {
  readonly dev_tools_enabled: boolean;
}

let main_window: BrowserWindow | null = null;

export async function create_main_window(
  options: Partial<MainWindowOptions> = {},
): Promise<BrowserWindow> {
  if (main_window) {
    return main_window;
  }

  const resolved_options: MainWindowOptions = {
    dev_tools_enabled: !app.isPackaged,
    ...options,
  };

  main_window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/context_bridge.js'),
      sandbox: false,
    },
  });

  const dev_server_url = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && dev_server_url) {
    await main_window.loadURL(dev_server_url);
    if (resolved_options.dev_tools_enabled) {
      main_window.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    const index_html = join(__dirname, '../../renderer/index.html');
    await main_window.loadFile(index_html);
  }

  main_window.on('ready-to-show', () => {
    main_window?.show();
  });

  main_window.on('closed', () => {
    main_window = null;
  });

  return main_window;
}

export function get_main_window(): BrowserWindow | null {
  return main_window;
}
