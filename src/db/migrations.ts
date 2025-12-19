// src/db/migrations.ts
import type * as SQLite from "expo-sqlite";

export async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Si la tabla no existe aún, no hay nada que migrar
  try {
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(photos);"
    );

    const hasPhotoUri = columns.some(c => c.name === "photo_uri");
    const hasPngUri = columns.some(c => c.name === "png_uri");

    if (!hasPhotoUri) {
      await db.execAsync(
        "ALTER TABLE photos ADD COLUMN photo_uri TEXT;"
      );
    }

    if (hasPngUri) {
      await db.execAsync(`
        UPDATE photos
        SET photo_uri = png_uri
        WHERE photo_uri IS NULL
      `);
    }
  } catch (err) {
    // Si falla porque no existe "photos" (primera instalación),
    // no hacemos nada: schema.ts la creará.
    console.log("Migration skipped:", err);
  }
}
