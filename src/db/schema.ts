export const SQLITE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NULL,
  phone TEXT NOT NULL UNIQUE,
  is_protected INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY DEFAULT 1,
  user_id TEXT NOT NULL,
  logged_in_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS local_letters (
      local_id TEXT PRIMARY KEY,
      server_id TEXT NULL,
      slip_id TEXT NULL,
      
      -- Datos del Niño/Carta
      child_code TEXT NOT NULL,
      child_name TEXT NULL,
      village TEXT NULL,
      community_id TEXT NULL,       -- 🆕 ID Comunidad (Ej: 4089)
      contact_name TEXT NULL,
      
      -- Tipos y Fechas
      letter_type TEXT NULL,        -- 🆕 (Welcome, Reply, Thank You)
      due_date TEXT NULL,           -- Fecha PDF
      technician_due_date TEXT NULL,-- 🆕 Fecha Calculada para Técnico
      
      -- Estado y Flujo
      status TEXT NOT NULL,
      return_reason TEXT NULL,
      
      -- Contenido Actual (Lo que el técnico escribe ahora)
      message_content TEXT,
      
      -- 🆕 DATOS PREVIOS (Para editar si fue RETURNED)
      prev_message TEXT NULL,       -- Mensaje anterior devuelto
      prev_photos TEXT NULL,        -- JSON string con URLs de fotos anteriores
      prev_drawing TEXT NULL,       -- URL del dibujo anterior
      
      local_user_phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter_id TEXT NOT NULL,
  slot INTEGER NOT NULL,
  file_path TEXT NOT NULL, 
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  FOREIGN KEY (letter_id) REFERENCES local_letters(local_id) ON DELETE CASCADE
);

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
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  next_retry_at TEXT NULL,
  created_at TEXT NOT NULL
);
`;