PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS local_letters (
  local_id TEXT PRIMARY KEY,
  server_id TEXT NULL,
  child_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAFT','PENDING_SYNC','SYNCED')),
  text_feelings TEXT,
  text_activities TEXT,
  text_learning TEXT,
  text_share TEXT,
  text_thanks TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_letters_status ON local_letters(status);

CREATE TABLE IF NOT EXISTS local_drawings (
  id TEXT PRIMARY KEY,
  local_letter_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sha256 TEXT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (local_letter_id) REFERENCES local_letters(local_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('LETTER','DRAWING')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE','UPLOAD')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  next_retry_at TEXT NULL,
  created_at TEXT NOT NULL
);
