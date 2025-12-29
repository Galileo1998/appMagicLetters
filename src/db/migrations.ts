// src/db/migrations.ts
import type * as SQLite from "expo-sqlite";

export async function migrate(db: SQLite.SQLiteDatabase) {
  // Apagamos FK para poder recrear tablas si es necesario
  await db.execAsync(`PRAGMA foreign_keys = OFF;`);

  // =====================================================
  // 1) LOCAL_LETTERS (Actualizada con nuevos campos)
  // =====================================================
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_letters (
      local_id TEXT PRIMARY KEY,
      server_id TEXT,
      slip_id TEXT,               -- Nuevo
      child_code TEXT NOT NULL,
      child_name TEXT,            -- Nuevo
      village TEXT,               -- Nuevo
      contact_name TEXT,          -- Nuevo
      due_date TEXT,              -- Nuevo
      
      status TEXT NOT NULL,       -- DRAFT | PENDING_SYNC | SYNCED | ASSIGNED

      text_feelings TEXT,
      text_activities TEXT,
      text_learning TEXT,
      text_share TEXT,
      text_thanks TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      assigned_user_id TEXT       -- Nuevo (opcional)
    );
  `);

  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_local_letters_child_code ON local_letters(child_code);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_local_letters_status ON local_letters(status);`);

  // =====================================================
  // 2) LETTERS (Espejo Legacy - Mantener para compatibilidad)
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

  // Triggers para sincronizar espejo
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
      SET child_code = NEW.child_code, status = NEW.status, text_feelings = NEW.text_feelings, updated_at = NEW.updated_at
      WHERE local_id = NEW.local_id;
    END;
  `);

  // =====================================================
  // 3) TABLAS HIJAS (Drawings, Messages, Photos)
  // =====================================================
  
  // DRAWINGS
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_id TEXT NOT NULL,
      svg_xml TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (letter_id) REFERENCES letters(local_id) ON DELETE CASCADE
    );
  `);

  // MESSAGES
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (letter_id) REFERENCES letters(local_id) ON DELETE CASCADE
    );
  `);

  // PHOTOS
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_id TEXT NOT NULL,
      slot INTEGER NOT NULL,
      photo_uri TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (letter_id) REFERENCES letters(local_id) ON DELETE CASCADE,
      CONSTRAINT ck_photos_slot CHECK (slot IN (1,2,3))
    );
  `);

  // =====================================================
  // 4) USUARIOS Y SESIÓN
  // =====================================================
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL UNIQUE,
      is_protected INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT NOT NULL,
      logged_in_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed Admin
  const adminId = "ADMIN_FIXED";
  await db.execAsync(`
    INSERT OR IGNORE INTO users (id, role, name, email, phone, is_protected, created_at, updated_at)
    VALUES ('${adminId}', 'ADMIN', 'Administrador', 'accionhonduras.org', '08019005012310', 1, datetime('now'), datetime('now'));
  `);

  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  console.log("[DB] Migración Completa (Estructura Nueva)");
}