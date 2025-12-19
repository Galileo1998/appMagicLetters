// src/db/db.ts
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { SQLITE_SCHEMA } from "./schema";

const DB_NAME = "scip_cartas_v3.db"; // <-- CAMBIAR VERSION evita la BD vieja
let db: SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (!db) {
    db = await openDatabaseAsync(DB_NAME);
  }
  return db;
}

export async function exec(sql: string) {
  const database = await getDb();
  await database.execAsync(sql);
}

export async function initDb() {
  const database = await getDb();

  // Importante: FK ON
  await database.execAsync("PRAGMA foreign_keys = ON;");

  const statements = SQLITE_SCHEMA.split(";").map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    await database.execAsync(stmt + ";");
  }
}
