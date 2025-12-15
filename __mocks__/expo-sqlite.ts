import type { Database as SqlJsDatabase, SqlJsStatic } from "sql.js";
// sql.js 提供了 asm 版本，避免 wasm 在测试环境中的内存限制。
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs: (config?: unknown) => Promise<SqlJsStatic> = require("sql.js/dist/sql-asm.js");

export type SQLiteRunResult = {
  changes: number;
  lastInsertRowId: number;
};

const sqlPromise: Promise<SqlJsStatic> = initSqlJs();

const normalizeParams = (params: unknown[]): unknown[] =>
  params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

class MockSQLiteDatabase {
  constructor(private readonly db: SqlJsDatabase) {}

  async execAsync(source: string) {
    this.db.run(source);
  }

  async runAsync(source: string, ...params: unknown[]): Promise<SQLiteRunResult> {
    const stmt = this.db.prepare(source);
    stmt.bind(normalizeParams(params) as any);
    stmt.step();
    stmt.free();

    const changes = this.db.getRowsModified();
    const lastInsertRowId =
      this.db.exec("SELECT last_insert_rowid() as id")[0]?.values?.[0]?.[0] ?? 0;

    return { changes, lastInsertRowId };
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(source);
    stmt.bind(normalizeParams(params) as any);

    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }

    stmt.free();
    return rows;
  }

  async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, ...params);
    return rows[0] ?? null;
  }

  async withTransactionAsync(task: (txn: MockSQLiteDatabase) => Promise<void>) {
    this.db.run("BEGIN");
    try {
      await task(this);
      this.db.run("COMMIT");
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    }
  }

  async withExclusiveTransactionAsync(
    task: (txn: MockSQLiteDatabase) => Promise<void>,
  ) {
    return this.withTransactionAsync(task);
  }

  async closeAsync() {
    this.db.close();
  }
}

const createDbInstance = async () => {
  const SQL = await sqlPromise;
  return new MockSQLiteDatabase(new SQL.Database());
};

export const openDatabaseAsync = async () => createDbInstance();
export const openDatabaseSync = () => {
  throw new Error("openDatabaseSync 在测试环境中未实现，请使用 openDatabaseAsync");
};
