import * as SQLite from "expo-sqlite";

import { enableForeignKeysPragma, schemaSql } from "./schema";

export type DatabaseConnection = SQLite.SQLiteDatabase;

export const DEFAULT_DB_NAME = "tango-card.db";

export const openDatabase = async (
  databaseName = DEFAULT_DB_NAME,
): Promise<DatabaseConnection> => {
  const db = await SQLite.openDatabaseAsync(databaseName);
  await initializeDatabase(db);
  return db;
};

export const initializeDatabase = async (db: DatabaseConnection) => {
  await db.execAsync(enableForeignKeysPragma);
  await db.withTransactionAsync(async () => {
    await db.execAsync(schemaSql);
  });
};

export const clearDatabase = async (db: DatabaseConnection) => {
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      `
        DELETE FROM review_events;
        DELETE FROM word_entries;
        DELETE FROM activity_log;
        DELETE FROM sync_queue;
      `,
    );
  });
};
