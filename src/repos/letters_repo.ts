// src/repos/letters_repo.ts
import { getDb } from "../db";

// ---------------------------------------------------------
// 1. TIPOS
// ---------------------------------------------------------

export type LetterRow = {
  local_id: string;
  server_id: string | null;
  slip_id: string | null;
  
  // Datos del Niño/Carta
  child_code: string;
  child_name: string | null;
  village: string | null;
  contact_name: string | null;
  letter_type: string | null; // 👈 NUEVO: Tipo de carta
  
  // Fechas
  due_date: string | null;           
  days_remaining?: number | null;    
  
  // Estado
  status: "DRAFT" | "PENDING_SYNC" | "SYNCED" | "ASSIGNED" | "RETURNED" | "COMPLETADO";
  return_reason?: string | null;
  message_content: string | null;
  
  // Datos previos (Correcciones)
  prev_message?: string | null;
  prev_photos?: string | null;
  prev_drawing?: string | null;

  local_user_phone?: string | null;
  created_at: string;
  updated_at: string;
  
  // Contadores (Para validar envío)
  has_message?: number;
  photos_count?: number;
  has_drawing?: number;
};

export function makeLocalId() {
  return `L${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

// ---------------------------------------------------------
// 2. FUNCIONES
// ---------------------------------------------------------

/**
 * 1. LISTAR (Para el Home)
 */
export async function listLetters(userPhone: string, params?: { onlyDrafts?: boolean }): Promise<LetterRow[]> {
  const db = await getDb();
  
  const whereStatus = params?.onlyDrafts 
    ? `AND ll.status IN ('DRAFT', 'ASSIGNED', 'PENDING_SYNC', 'RETURNED')` 
    : ``;

  // Aseguramos que se seleccione 'letter_type'
  const rows = await db.getAllAsync<LetterRow>(`
    SELECT ll.*,
      (CASE WHEN length(ll.message_content) > 5 THEN 1 ELSE 0 END) AS has_message,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id) AS photos_count,
      (SELECT 1 FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing
    FROM local_letters ll
    WHERE ll.local_user_phone = ?
    ${whereStatus}
    ORDER BY 
      CASE WHEN ll.status = 'RETURNED' THEN 0 ELSE 1 END, 
      ll.days_remaining ASC, 
      ll.updated_at DESC;
  `, [userPhone]);

  return rows.map(r => ({
    ...r,
    has_message: Number(r.has_message ?? 0),
    photos_count: Number(r.photos_count ?? 0),
    has_drawing: Number(r.has_drawing ?? 0),
  }));
}

/**
 * 2. OBTENER UNA CARTA (Detalle)
 */
export async function getLetter(localId: string): Promise<LetterRow | null> {
  const db = await getDb();
  
  const row = await db.getFirstAsync<LetterRow>(
    `SELECT ll.*,
      (CASE WHEN length(ll.message_content) > 5 THEN 1 ELSE 0 END) AS has_message,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id) AS photos_count,
      (SELECT 1 FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing
     FROM local_letters ll WHERE ll.local_id = ? LIMIT 1`,
    [localId]
  );

  if (!row) return null;

  return {
    ...row,
    has_message: Number(row.has_message ?? 0),
    photos_count: Number(row.photos_count ?? 0),
    has_drawing: Number(row.has_drawing ?? 0),
  };
}

/**
 * 3. LIMPIAR
 */
export async function clearLocalLetters(userPhone: string) {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM local_letters 
     WHERE status IN ('ASSIGNED', 'RETURNED') 
     AND local_user_phone = ?`, 
    [userPhone]
  );
}

/**
 * 4. GUARDAR (SYNC)
 * Aquí agregamos 'letter_type' al UPDATE e INSERT
 */
/**
 * 4. GUARDAR (SYNC)
 */
export async function saveSyncedLetter(data: any, userPhone: string) {
  const db = await getDb();
  const t = new Date().toISOString();

  // Migración silenciosa
  try { await db.runAsync("ALTER TABLE local_letters ADD COLUMN letter_type TEXT NULL"); } catch (e) {}
  try { await db.runAsync("ALTER TABLE local_letters ADD COLUMN days_remaining INTEGER NULL"); } catch (e) {}

  const existing = await db.getFirstAsync<{ local_id: string }>(
    `SELECT local_id FROM local_letters WHERE server_id = ? AND local_user_phone = ?`,
    [String(data.id), userPhone] 
  );

  const status = data.status || 'ASSIGNED';
  const reason = data.return_reason || null;
  const daysLeft = (data.days_remaining !== undefined) ? data.days_remaining : null;
  
  // 🛡️ CORRECCIÓN AQUÍ: Aceptamos 'letter_type' O 'type'
  const letterType = data.letter_type || data.type || 'Standard'; 

  // Datos previos
  const prevMsg = data.returned_data?.message || null;
  const prevDraw = data.returned_data?.drawing || null;
  const prevPhotos = data.returned_data?.photos ? JSON.stringify(data.returned_data.photos) : null;

  if (existing) {
    await db.runAsync(
      `UPDATE local_letters 
       SET slip_id=?, child_name=?, village=?, status=?, return_reason=?, 
           prev_message=?, prev_drawing=?, prev_photos=?, updated_at=?,
           due_date=?, days_remaining=?, letter_type=?
       WHERE local_id=?`,
      [
        data.slip_id, data.child_name, data.village, status, reason, 
        prevMsg, prevDraw, prevPhotos, t,
        data.technician_due_date, daysLeft, letterType,
        existing.local_id
      ]
    );
  } else {
    const newLocalId = makeLocalId();
    await db.runAsync(
      `INSERT INTO local_letters (
        local_id, server_id, slip_id, child_code, child_name, village, contact_name, due_date,
        status, return_reason, message_content, local_user_phone, 
        prev_message, prev_drawing, prev_photos, created_at, updated_at,
        days_remaining, letter_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newLocalId, String(data.id), data.slip_id, data.child_nbr || data.child_code, 
        data.child_name, data.village, data.contact_name, data.technician_due_date, status, reason, 
        userPhone, 
        prevMsg, prevDraw, prevPhotos, t, t,
        daysLeft, letterType
      ]
    );
  }
}

export async function setLetterStatus(localId: string, status: LetterRow["status"]) {
  const db = await getDb();
  await db.runAsync(`UPDATE local_letters SET status = ?, updated_at = datetime('now') WHERE local_id = ?`, [status, localId]);
}

export async function updateLetterMessage(localId: string, text: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE local_letters SET message_content = ?, updated_at = datetime('now') WHERE local_id = ?`, [text, localId]);
}