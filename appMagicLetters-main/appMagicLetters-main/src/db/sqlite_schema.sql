PRAGMA foreign_keys = ON;

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('ADMIN','TECH')),
  name TEXT NOT NULL,
  email TEXT NULL,
  phone TEXT NOT NULL UNIQUE,
  is_protected INTEGER DEFAULT 0
);

-- 2. Sesión
CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY DEFAULT 1,
  user_id TEXT NOT NULL,
  logged_in_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Cartas Locales (Aquí se guarda el texto ahora)
CREATE TABLE IF NOT EXISTS local_letters (
  local_id TEXT PRIMARY KEY,
  server_id TEXT NULL,
  slip_id TEXT NULL,
  child_code TEXT NOT NULL,
  child_name TEXT NULL,
  village TEXT NULL,
  contact_name TEXT NULL,
  due_date TEXT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAFT','PENDING_SYNC','SYNCED','ASSIGNED')),
  
  -- Campos de texto directo en la tabla
  text_feelings TEXT,
  text_activities TEXT,
  text_learning TEXT,
  text_share TEXT,
  text_thanks TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_letters_status ON local_letters(status);

-- 4. Mensajes (Tabla auxiliar, la dejamos por compatibilidad)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  letter_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (letter_id) REFERENCES local_letters(local_id) ON DELETE CASCADE
);

-- 5. Fotos
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  letter_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (letter_id) REFERENCES local_letters(local_id) ON DELETE CASCADE
);

-- 6. Dibujos (LA TABLA QUE TE FALTA AHORA MISMO)
CREATE TABLE IF NOT EXISTS local_drawings (
  id TEXT PRIMARY KEY,
  local_letter_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sha256 TEXT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (local_letter_id) REFERENCES local_letters(local_id) ON DELETE CASCADE
);

-- 7. Cola de Sincronización
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