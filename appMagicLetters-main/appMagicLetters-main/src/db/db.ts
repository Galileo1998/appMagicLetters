// src/db/db.ts
import * as SQLite from "expo-sqlite";
import { migrate } from "./migrations";
import { SQLITE_SCHEMA } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    // 👇 CAMBIO AQUÍ: Cambiamos a '3' para forzar una base de datos nueva y limpia
    db = await SQLite.openDatabaseAsync("magic_adventure8.db");
    
    await db.execAsync(SQLITE_SCHEMA);
    await migrate(db);
    console.log("[DB] initialized (v3)");
  }
  return db;
}

export async function initDb(): Promise<void> {
  await getDb();
}