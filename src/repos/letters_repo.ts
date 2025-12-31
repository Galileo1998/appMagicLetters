import { getDb } from "../db";

export function makeLocalId() {
  return `L${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export type LetterRow = {
  local_id: string;
  server_id: string | null;
  slip_id: string | null;
  child_code: string;
  child_name: string | null;
  village: string | null;
  contact_name: string | null;
  due_date: string | null;
  // Estados permitidos
  status: "DRAFT" | "PENDING_SYNC" | "SYNCED" | "ASSIGNED" | "RETURNED" | "COMPLETADO";
  message_content: string | null;
  return_reason?: string | null; // Columna para el motivo de rechazo
  created_at: string;
  updated_at: string;
  // Campos calculados para la UI
  has_message?: number;
  photos_count?: number;
  has_drawing?: number;
};

/**
 * Obtiene la lista de cartas para el técnico
 */
export async function listLetters(params?: { onlyDrafts?: boolean }): Promise<LetterRow[]> {
  const db = await getDb();
  // Incluimos RETURNED en la vista de borradores/pendientes
  const where = params?.onlyDrafts 
    ? `WHERE ll.status IN ('DRAFT', 'ASSIGNED', 'PENDING_SYNC', 'RETURNED')` 
    : ``;

  const rows = await db.getAllAsync<LetterRow>(`
    SELECT ll.*,
      (CASE WHEN length(ll.message_content) > 5 THEN 1 ELSE 0 END) AS has_message,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id) AS photos_count,
      (SELECT 1 FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing
    FROM local_letters ll
    ${where}
    ORDER BY 
      CASE WHEN ll.status = 'RETURNED' THEN 0 ELSE 1 END, 
      ll.due_date ASC, 
      ll.updated_at DESC;
  `);

  return rows.map(r => ({
    ...r,
    has_message: Number(r.has_message ?? 0),
    photos_count: Number(r.photos_count ?? 0),
    has_drawing: Number(r.has_drawing ?? 0),
  }));
}

/**
 * Obtiene una sola carta por su ID local (Corregido para evitar el error undefined)
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
 * Limpia las cartas asignadas antes de un Pull para evitar mezcla de técnicos
 */
export async function clearLocalLetters() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_letters WHERE status IN ('ASSIGNED', 'RETURNED')`);
}

/**
 * Guarda una carta bajada del servidor (Sincronización)
 */
export async function saveSyncedLetter(data: any) {
  const db = await getDb();
  const t = new Date().toISOString();

  const existing = await db.getFirstAsync<{ local_id: string }>(
    `SELECT local_id FROM local_letters WHERE server_id = ?`,
    [String(data.id)] 
  );

  const status = data.status || 'ASSIGNED';
  const reason = data.return_reason || null;

  if (existing) {
    // Si ya existe (ej: fue devuelta), actualizamos estado y motivo
    await db.runAsync(
      `UPDATE local_letters 
       SET slip_id=?, child_name=?, village=?, status=?, return_reason=?, updated_at=?
       WHERE local_id=?`,
      [data.slip_id, data.child_name, data.village, status, reason, t, existing.local_id]
    );
  } else {
    // Inserción de carta nueva
    const newLocalId = makeLocalId();
    await db.runAsync(
      `INSERT INTO local_letters (
        local_id, server_id, slip_id, child_code, child_name, village, contact_name, due_date,
        status, return_reason, message_content, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
      [
        newLocalId, String(data.id), data.slip_id, data.child_nbr || data.child_code, 
        data.child_name, data.village, data.contact_name, data.due_date, status, reason, t, t
      ]
    );
  }
}

/**
 * Actualiza solo el estado de la carta
 */
export async function setLetterStatus(localId: string, status: LetterRow["status"]) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET status = ?, updated_at = datetime('now') WHERE local_id = ?`,
    [status, localId]
  );
}

/**
 * Guarda el mensaje de texto de la carta
 */
export async function updateLetterMessage(localId: string, text: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET message_content = ?, updated_at = datetime('now') WHERE local_id = ?`,
    [text, localId]
  );
}