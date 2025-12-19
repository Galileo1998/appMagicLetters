// src/db/migrations.ts
import type * as SQLite from "expo-sqlite";

export async function migrate(db: SQLite.SQLiteDatabase) {
  // Migración robusta: OFF durante cambios, ON al final
  await db.execAsync(`PRAGMA foreign_keys = OFF;`);

  // -------- helpers
  async function tableExists(name: string) {
    const row = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name=?;`,
      [name]
    );
    return (row?.c ?? 0) > 0;
  }

  async function getCols(table: string) {
    if (!(await tableExists(table))) return [];
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(${table});`
    );
    return cols.map(c => c.name);
  }

  // =====================================================
  // 1) LOCAL_LETTERS (tabla real del app)
  // =====================================================
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_letters (
      local_id TEXT PRIMARY KEY,
      server_id TEXT,
      child_code TEXT NOT NULL,
      status TEXT NOT NULL,                 -- DRAFT | PENDING_SYNC | SYNCED

      text_feelings TEXT,
      text_activities TEXT,
      text_learning TEXT,
      text_share TEXT,
      text_thanks TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_local_letters_child_code
    ON local_letters(child_code);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_local_letters_status
    ON local_letters(status);
  `);

  // =====================================================
  // 2) LETTERS (LEGACY) - PERO ahora como "mirror" de local_letters
  //    Esto es CLAVE para que NO fallen las FK de photos/drawings/messages.
  // =====================================================
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      child_code TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      text_feelings TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_letters_child_code
    ON letters(child_code);
  `);

  // ✅ Puente: asegurar que TODO local_letters exista también en letters
  // (Solo se llena lo mínimo; no rompe nada y salva las FK)
  await db.execAsync(`
    INSERT OR IGNORE INTO letters (local_id, child_code, status, text_feelings, created_at, updated_at)
    SELECT
      local_id,
      child_code,
      status,
      text_feelings,
      created_at,
      updated_at
    FROM local_letters;
  `);

  // ✅ Trigger para mantener sincronizado (opcional, pero muy útil)
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS trg_local_letters_to_letters_ai
    AFTER INSERT ON local_letters
    BEGIN
      INSERT OR IGNORE INTO letters (local_id, child_code, status, text_feelings, created_at, updated_at)
      VALUES (NEW.local_id, NEW.child_code, NEW.status, NEW.text_feelings, NEW.created_at, NEW.updated_at);
    END;
  `);

  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS trg_local_letters_to_letters_au
    AFTER UPDATE ON local_letters
    BEGIN
      UPDATE letters
      SET
        child_code = NEW.child_code,
        status = NEW.status,
        text_feelings = NEW.text_feelings,
        updated_at = NEW.updated_at
      WHERE local_id = NEW.local_id;
    END;
  `);

  // =====================================================
  // 3) DRAWINGS (referencia letters.local_id, ahora ya no se rompe)
  // =====================================================
  const drawingsExists = await tableExists("drawings");

  if (!drawingsExists) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS drawings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        letter_id TEXT NOT NULL,               -- letters.local_id
        svg_xml TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (letter_id)
          REFERENCES letters(local_id)
          ON DELETE CASCADE
      );
    `);

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_drawings_letter
      ON drawings(letter_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_drawings_letter_id
      ON drawings(letter_id);
    `);
  } else {
    const dcols = await getCols("drawings");

    if (dcols.includes("svg") && !dcols.includes("svg_xml")) {
      await db.execAsync(`ALTER TABLE drawings ADD COLUMN svg_xml TEXT;`);
      await db.execAsync(`UPDATE drawings SET svg_xml = svg WHERE svg_xml IS NULL;`);
    }

    if (!dcols.includes("svg_xml")) {
      await db.execAsync(`ALTER TABLE drawings ADD COLUMN svg_xml TEXT;`);
    }

    if (!dcols.includes("updated_at")) {
      await db.execAsync(`ALTER TABLE drawings ADD COLUMN updated_at TEXT;`);
      await db.execAsync(
        `UPDATE drawings SET updated_at = datetime('now') WHERE updated_at IS NULL;`
      );
    }

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_drawings_letter
      ON drawings(letter_id);
    `);
  }

  // =====================================================
  // 4) MESSAGES
  // =====================================================
  const messagesExists = await tableExists("messages");

  if (!messagesExists) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        letter_id TEXT NOT NULL,               -- letters.local_id
        text TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (letter_id)
          REFERENCES letters(local_id)
          ON DELETE CASCADE
      );
    `);

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_messages_letter
      ON messages(letter_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_messages_letter_id
      ON messages(letter_id);
    `);
  } else {
    const mcols = await getCols("messages");

    if (!mcols.includes("updated_at")) {
      await db.execAsync(`ALTER TABLE messages ADD COLUMN updated_at TEXT;`);
      await db.execAsync(
        `UPDATE messages SET updated_at = datetime('now') WHERE updated_at IS NULL;`
      );
    }

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_messages_letter
      ON messages(letter_id);
    `);
  }

  // =====================================================
  // 5) PHOTOS (3 slots)
  // =====================================================
  const photosExists = await tableExists("photos");

  if (!photosExists) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        letter_id TEXT NOT NULL,               -- letters.local_id
        slot INTEGER NOT NULL,                 -- 1..3
        photo_uri TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (letter_id)
          REFERENCES letters(local_id)
          ON DELETE CASCADE,
        CONSTRAINT ck_photos_slot CHECK (slot IN (1,2,3))
      );
    `);

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_photos_letter_slot
      ON photos(letter_id, slot);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_photos_letter_id
      ON photos(letter_id);
    `);
  } else {
    const pcols = await getCols("photos");
    const hasSlot = pcols.includes("slot");

    if (!hasSlot) {
      await db.execAsync(`
        ALTER TABLE photos RENAME TO photos_old;

        CREATE TABLE photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          letter_id TEXT NOT NULL,
          slot INTEGER NOT NULL,
          photo_uri TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (letter_id) REFERENCES letters(local_id) ON DELETE CASCADE,
          CONSTRAINT ck_photos_slot CHECK (slot IN (1,2,3))
        );

        CREATE UNIQUE INDEX ux_photos_letter_slot ON photos(letter_id, slot);
        CREATE INDEX idx_photos_letter_id ON photos(letter_id);
      `);

      const oldCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(photos_old);`);
      const oldNames = oldCols.map(c => c.name);

      const sourceExpr =
        oldNames.includes("photo_uri")
          ? "photo_uri"
          : oldNames.includes("png_uri")
            ? "png_uri"
            : oldNames.includes("photo")
              ? "photo"
              : "NULL";

      // ✅ IMPORTANTE: solo migrar fotos cuya letter_id exista en letters
      await db.execAsync(`
        INSERT INTO photos (letter_id, slot, photo_uri, created_at, updated_at)
        SELECT
          po.letter_id,
          1 as slot,
          ${sourceExpr} as photo_uri,
          COALESCE(po.created_at, datetime('now')),
          datetime('now')
        FROM photos_old po
        WHERE ${sourceExpr} IS NOT NULL AND ${sourceExpr} != ''
          AND po.letter_id IN (SELECT local_id FROM letters);
      `);

      await db.execAsync(`DROP TABLE photos_old;`);
    } else {
      if (!pcols.includes("photo_uri")) {
        await db.execAsync(`ALTER TABLE photos ADD COLUMN photo_uri TEXT;`);
      }

      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS ux_photos_letter_slot
        ON photos(letter_id, slot);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_letter_id
        ON photos(letter_id);
      `);
    }
  }

  // =====================================================
  // 6) Limpieza de huérfanos (por si había datos viejos)
  // =====================================================
  await db.execAsync(`
    DELETE FROM photos
    WHERE letter_id NOT IN (SELECT local_id FROM letters);
  `);
  await db.execAsync(`
    DELETE FROM drawings
    WHERE letter_id NOT IN (SELECT local_id FROM letters);
  `);
  await db.execAsync(`
    DELETE FROM messages
    WHERE letter_id NOT IN (SELECT local_id FROM letters);
  `);

  // Encender FK al final y verificar
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  const fk = await db.getAllAsync<any>(`PRAGMA foreign_key_check;`);
  if (fk.length) {
    console.log("[DB] foreign_key_check problems:", fk);
    // Si quieres ser estricto:
    // throw new Error("FK check failed");
  }

  console.log("[DB] migrate() OK");
}
