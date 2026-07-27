import * as SQLite from "expo-sqlite";

export async function migrate(db: SQLite.SQLiteDatabase) {
  async function addColumn(table: string, column: string, definition: string) {
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!columns.some((item) => item.name === column)) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  await addColumn("local_letters", "local_user_phone", "TEXT NULL");
  await addColumn("local_letters", "message_content", "TEXT NULL");
  await addColumn("local_letters", "return_reason", "TEXT NULL");
  await addColumn("local_letters", "submission_id", "TEXT NULL");
  await addColumn("local_letters", "sync_error", "TEXT NULL");
  await addColumn("photos", "slot", "INTEGER NULL");
  await addColumn("photos", "file_path", "TEXT NULL");
  await addColumn("photos", "description", "TEXT NOT NULL DEFAULT ''");
  await addColumn("photos", "updated_at", "TEXT NULL");
  await addColumn("local_drawings", "description", "TEXT NOT NULL DEFAULT ''");

  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_photos_letter_slot ON photos(letter_id, slot);
    CREATE INDEX IF NOT EXISTS idx_letters_owner_status ON local_letters(local_user_phone, status);
  `);
}
