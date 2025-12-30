import * as SQLite from "expo-sqlite";

export async function migrate(db: SQLite.SQLiteDatabase) {
  console.log("[Migrations] Iniciando migración limpia para v9...");

  // Como estamos en una instalación limpia (v9), el schema.ts ya creó las tablas correctas
  // con la columna 'message_content'. No necesitamos recrear tablas ni triggers viejos.

  // =====================================================
  // SEED: USUARIO ADMINISTRADOR
  // =====================================================
  // Insertamos el usuario por defecto para que puedas hacer login
  const adminId = "ADMIN_FIXED";
  try {
    await db.execAsync(`
      INSERT OR IGNORE INTO users (id, role, name, email, phone, is_protected, created_at, updated_at)
      VALUES ('${adminId}', 'ADMIN', 'Administrador', 'accionhonduras.org', '08019005012310', 1, datetime('now'), datetime('now'));
    `);
    console.log("[Migrations] Usuario Admin verificado/insertado.");
  } catch (e) {
    console.error("[Migrations] Error insertando Admin:", e);
  }

  console.log("[Migrations] Listo.");
}