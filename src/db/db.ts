
// src/db/db.ts
import * as SQLite from "expo-sqlite";
import { migrate } from "./migrations";
import { SQLITE_SCHEMA } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("magic_adventure.db");
    await db.execAsync(SQLITE_SCHEMA);
    await migrate(db);
    console.log("[DB] initialized");
  }
  return db;
}

export async function initDb(): Promise<void> {
  await getDb();
}
