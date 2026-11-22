import type { SQLiteDatabase } from 'expo-sqlite';
import { migrations } from './schema';
import { seedDatabase } from './seed';

export const USER_ID = 'local-user';

export async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= version) continue;
    await db.execAsync(migration.up);
    version = migration.version;
  }
  await db.execAsync(`PRAGMA user_version = ${version}`);

  await seedDatabase(db);
}

export function uid(): string {
  const rnd = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rnd()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
