import { Platform } from 'react-native';
import type * as SQLite from 'expo-sqlite';

import { runSqliteMigrations } from '@/lib/migrations';

let db: SQLite.SQLiteDatabase | null = null;

const INIT_SQL = `
      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retries INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        next_attempt_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS routes_cache (
        route_date TEXT PRIMARY KEY NOT NULL,
        json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS visit_local (
        parada_id TEXT NOT NULL,
        route_date TEXT NOT NULL,
        check_in_at TEXT,
        check_out_at TEXT,
        next_step TEXT,
        next_note TEXT,
        PRIMARY KEY (parada_id, route_date)
      );
      CREATE TABLE IF NOT EXISTS game_wallet (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        xp INTEGER NOT NULL DEFAULT 0,
        coins INTEGER NOT NULL DEFAULT 0
      );
      INSERT OR IGNORE INTO game_wallet (id, xp, coins) VALUES (1, 120, 40);
      CREATE TABLE IF NOT EXISTS mission_progress (
        mission_id TEXT PRIMARY KEY NOT NULL,
        current INTEGER NOT NULL DEFAULT 0,
        target INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS store_redemptions (
        id TEXT PRIMARY KEY NOT NULL,
        reward_id TEXT NOT NULL,
        title TEXT NOT NULL,
        coins_spent INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    if (Platform.OS === 'web') {
      const { getWebMemoryDb } = require('./webMemoryDb') as typeof import('./webMemoryDb');
      db = getWebMemoryDb();
    } else {
      const SQLiteMod = require('expo-sqlite') as typeof import('expo-sqlite');
      db = SQLiteMod.openDatabaseSync('rg_ambiental.db');
      db.execSync(INIT_SQL);
    }
    runSqliteMigrations(db);
  }
  return db;
}
