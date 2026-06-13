import type * as SQLite from 'expo-sqlite';

/**
 * Migrações incrementais após `CREATE TABLE IF NOT EXISTS` inicial.
 * Bases antigas sem `next_attempt_at` recebem a coluna uma vez.
 */
export function runSqliteMigrations(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync('ALTER TABLE outbox ADD COLUMN last_error TEXT');
  } catch {
    /* coluna já existe */
  }
  try {
    db.execSync('ALTER TABLE outbox ADD COLUMN next_attempt_at INTEGER NOT NULL DEFAULT 0');
  } catch {
    /* coluna já existe */
  }
}
