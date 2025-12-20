import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { schema } from './schema';

export interface DatabaseContext {
  sqlite: BetterSqliteDatabase;
  db: BetterSQLite3Database<typeof schema>;
}

const DB_FILENAME = 'tango-card.sqlite';

export function initializeDatabase(databaseFilePath?: string): DatabaseContext {
  const resolvedPath = resolveDatabasePath(databaseFilePath);
  ensureDirectory(resolvedPath);

  const sqlite = new Database(resolvedPath);
  sqlite.pragma('foreign_keys = ON');

  applySchema(sqlite);
  const db = drizzle(sqlite, { schema });

  return { sqlite, db };
}

function resolveDatabasePath(databaseFilePath?: string) {
  if (databaseFilePath) return databaseFilePath;
  const envPath = process.env.TANGO_CARD_DB_PATH;
  if (envPath) return path.resolve(envPath);
  const userDataPath = tryGetElectronUserDataPath();
  if (userDataPath) {
    return path.join(userDataPath, DB_FILENAME);
  }
  return path.join(process.cwd(), DB_FILENAME);
}

function ensureDirectory(filePath: string) {
  if (filePath === ':memory:') return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function tryGetElectronUserDataPath() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electronModule = require('electron') as
      | typeof import('electron')
      | string
      | undefined;
    if (
      electronModule &&
      typeof electronModule === 'object' &&
      'app' in electronModule &&
      electronModule.app?.getPath
    ) {
      return electronModule.app.getPath('userData');
    }
  } catch {
    // ignore resolution failures in non-Electron contexts
  }

  return null;
}

function applySchema(sqlite: BetterSqliteDatabase) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      pronunciation TEXT NOT NULL,
      definition_cn TEXT NOT NULL,
      examples_json TEXT NOT NULL DEFAULT '[]',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      srs_level INTEGER NOT NULL DEFAULT 0,
      srs_repetitions INTEGER NOT NULL DEFAULT 0,
      srs_interval INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      last_reviewed_at INTEGER,
      due_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS review_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      result TEXT NOT NULL CHECK (result IN ('again','hard','good','easy')),
      reviewed_at INTEGER NOT NULL DEFAULT (unixepoch()),
      delta_seconds INTEGER,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_review_events_word_id ON review_events(word_id);

    CREATE TABLE IF NOT EXISTS daily_activity (
      date INTEGER PRIMARY KEY,
      words_added_count INTEGER NOT NULL DEFAULT 0,
      reviews_done_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      api_key TEXT,
      preferred_model TEXT NOT NULL DEFAULT 'gemini-flash-2.5-lite',
      review_batch_size INTEGER NOT NULL DEFAULT 1,
      theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark','system'))
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `;

  sqlite.exec(ddl);
}
