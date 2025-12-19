// src/db/schema.ts
export const SQLITE_SCHEMA = `
PRAGMA foreign_keys = ON;

-- =====================================================
-- CARTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT UNIQUE NOT NULL,
  child_code TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  text_feelings TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_letters_child_code
  ON letters(child_code);

-- =====================================================
-- DIBUJOS
-- =====================================================
CREATE TABLE IF NOT EXISTS drawings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter_id TEXT NOT NULL,
  svg_xml TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (letter_id)
    REFERENCES letters(local_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_drawings_letter_id
  ON drawings(letter_id);

-- =====================================================
-- FOTOS (hasta 3 por carta)
-- =====================================================
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter_id TEXT NOT NULL,
  slot INTEGER NOT NULL,               -- 1,2,3
  photo_uri TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (letter_id)
    REFERENCES letters(local_id)
    ON DELETE CASCADE,
  CONSTRAINT ck_photos_slot CHECK (slot IN (1,2,3))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_photos_letter_slot
  ON photos(letter_id, slot);

CREATE INDEX IF NOT EXISTS idx_photos_letter_id
  ON photos(letter_id);

-- =====================================================
-- MENSAJES
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (letter_id)
    REFERENCES letters(local_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_messages_letter_id
  ON messages(letter_id);
`;
