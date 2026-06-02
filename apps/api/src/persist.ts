import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PipelineRow } from './seed.js';

export type SellerStatsSnapshot = {
  visitsWeek: number;
  proposalsWeek: number;
  contractsMonth: number;
  lastSyncAt: number | null;
  status: string;
};

export type StoreSnapshot = {
  syncedIds: string[];
  pipeline: PipelineRow[];
  sellerStats: Record<string, SellerStatsSnapshot>;
};

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

export function loadStoreSnapshot(): StoreSnapshot | null {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreSnapshot;
    if (!Array.isArray(parsed.syncedIds) || !Array.isArray(parsed.pipeline)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoreSnapshot(snapshot: StoreSnapshot): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
}
