import * as SQLite from "expo-sqlite";
import { migrate } from "./migrations";
import { SQLITE_SCHEMA } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("magic_adventure.db");

    // 1. Crear tablas base
    await db.execAsync(SQLITE_SCHEMA);

    // 2. MIGRAR (ESTO ES LO QUE TE FALTABA)
    await migrate(db);
  }
  return db;
}
