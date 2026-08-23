/**
 * Food Scan & AI Analysis Cache Engine
 * Backed by IndexedDB with localStorage fallback
 * 30-day TTL, LRU Eviction
 */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'vitaltrack_v2_cache';
const DB_VERSION = 1;
const STORE_SCANS = 'scans_cache';
const STORE_AI = 'ai_cache';
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_SCANS)) {
          db.createObjectStore(STORE_SCANS, { keyPath: 'hash' });
        }
        if (!db.objectStoreNames.contains(STORE_AI)) {
          db.createObjectStore(STORE_AI, { keyPath: 'hash' });
        }
      },
    });
  }
  return dbPromise;
}

export interface CacheEntry<T> {
  hash: string;
  data: T;
  timestamp: number;
}

export const scanCache = {
  async get<T>(hash: string): Promise<T | null> {
    try {
      const db = await getDB();
      if (!db) return null;
      const entry = (await db.get(STORE_SCANS, hash)) as CacheEntry<T> | undefined;
      if (!entry) return null;
      if (Date.now() - entry.timestamp > DEFAULT_TTL_MS) {
        await db.delete(STORE_SCANS, hash);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  },

  async set<T>(hash: string, data: T): Promise<void> {
    try {
      const db = await getDB();
      if (!db) return;
      await db.put(STORE_SCANS, {
        hash,
        data,
        timestamp: Date.now(),
      });
    } catch (e) {}
  },
};
