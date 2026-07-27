// src/repos/letters_repo.ts
import { getDb } from "../db";

// ---------------------------------------------------------
// 1. TIPOS Y UTILIDADES (Necesarios para que no de error)
// ---------------------------------------------------------

export type LetterRow = {
  local_id: string;
  server_id: string | null;
  slip_id: string | null;
  child_code: string;
  child_name: string | null;
  village: string | null;
  contact_name: string | null;
  due_date: string | null;
  status: "DRAFT" | "PENDING_SYNC" | "SYNCED" | "ASSIGNED" | "RETURNED" | "COMPLETADO";
  message_content: string | null;
  submission_id?: string | null;
  sync_error?: string | null;
  return_reason?: string | null;
  local_user_phone?: string | null; // ✅ Nueva columna
  created_at: string;
  updated_at: string;
  // Campos calculados
  has_message?: number;
  photos_count?: number;
  has_drawing?: number;
  described_photos_count?: number;
  has_drawing_description?: number;
  required_questions_count?: number;
  answered_required_count?: number;
  total_questions_count?: number;
  answered_questions_count?: number;
};

export function makeLocalId() {
  return `L${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

// ---------------------------------------------------------
// 2. FUNCIONES DEL REPOSITORIO
// ---------------------------------------------------------

/**
 * 1. LISTAR: Filtra por teléfono para que cada técnico vea solo lo suyo
 */
export async function listLetters(userPhone: string, params?: { onlyDrafts?: boolean }): Promise<LetterRow[]> {
  const db = await getDb();
  
  const whereStatus = params?.onlyDrafts 
    ? `AND ll.status IN ('DRAFT', 'ASSIGNED', 'PENDING_SYNC', 'RETURNED')` 
    : ``;

  // ✅ Agregamos WHERE ll.local_user_phone = ?
  const rows = await db.getAllAsync<LetterRow>(`
    SELECT ll.*,
      (CASE WHEN length(ll.message_content) > 5 THEN 1 ELSE 0 END) AS has_message,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id) AS photos_count,
      (SELECT 1 FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id AND length(trim(p.description)) > 0) AS described_photos_count,
      (SELECT CASE WHEN length(trim(d.description)) > 0 THEN 1 ELSE 0 END FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing_description,
      (SELECT COUNT(*) FROM questions q WHERE q.is_required = 1) AS required_questions_count,
      (SELECT COUNT(*) FROM letter_answers a INNER JOIN questions q ON q.id=a.question_id
        WHERE a.letter_id=ll.local_id AND q.is_required=1 AND length(trim(a.answer_text)) > 0) AS answered_required_count,
      (SELECT COUNT(*) FROM questions) AS total_questions_count,
      (SELECT COUNT(*) FROM letter_answers a
        WHERE a.letter_id=ll.local_id AND length(trim(a.answer_text)) > 0) AS answered_questions_count
    FROM local_letters ll
    WHERE ll.local_user_phone = ?
    ${whereStatus}
    ORDER BY 
      CASE WHEN ll.status = 'RETURNED' THEN 0 ELSE 1 END, 
      ll.due_date ASC, 
      ll.updated_at DESC;
  `, [userPhone]);

  return rows.map(r => ({
    ...r,
    has_message: Number(r.has_message ?? 0),
    photos_count: Number(r.photos_count ?? 0),
    has_drawing: Number(r.has_drawing ?? 0),
    described_photos_count: Number(r.described_photos_count ?? 0),
    has_drawing_description: Number(r.has_drawing_description ?? 0),
    required_questions_count: Number(r.required_questions_count ?? 0),
    answered_required_count: Number(r.answered_required_count ?? 0),
    total_questions_count: Number(r.total_questions_count ?? 0),
    answered_questions_count: Number(r.answered_questions_count ?? 0),
  }));
}

/**
 * 2. OBTENER UNA CARTA (Para la pantalla de detalle)
 */
export async function getLetter(localId: string): Promise<LetterRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LetterRow>(
    `SELECT ll.*,
      (CASE WHEN length(ll.message_content) > 5 THEN 1 ELSE 0 END) AS has_message,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id) AS photos_count,
      (SELECT 1 FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id AND length(trim(p.description)) > 0) AS described_photos_count,
      (SELECT CASE WHEN length(trim(d.description)) > 0 THEN 1 ELSE 0 END FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing_description,
      (SELECT COUNT(*) FROM questions q WHERE q.is_required = 1) AS required_questions_count,
      (SELECT COUNT(*) FROM letter_answers a INNER JOIN questions q ON q.id=a.question_id
        WHERE a.letter_id=ll.local_id AND q.is_required=1 AND length(trim(a.answer_text)) > 0) AS answered_required_count,
      (SELECT COUNT(*) FROM questions) AS total_questions_count,
      (SELECT COUNT(*) FROM letter_answers a
        WHERE a.letter_id=ll.local_id AND length(trim(a.answer_text)) > 0) AS answered_questions_count
     FROM local_letters ll WHERE ll.local_id = ? LIMIT 1`,
    [localId]
  );

  if (!row) return null;

  return {
    ...row,
    has_message: Number(row.has_message ?? 0),
    photos_count: Number(row.photos_count ?? 0),
    has_drawing: Number(row.has_drawing ?? 0),
    described_photos_count: Number(row.described_photos_count ?? 0),
    has_drawing_description: Number(row.has_drawing_description ?? 0),
    required_questions_count: Number(row.required_questions_count ?? 0),
    answered_required_count: Number(row.answered_required_count ?? 0),
    total_questions_count: Number(row.total_questions_count ?? 0),
    answered_questions_count: Number(row.answered_questions_count ?? 0),
  };
}

/**
 * 3. LIMPIAR: Borra solo las de ESTE técnico antes de sincronizar
 */
export async function clearLocalLetters(userPhone: string) {
  // Se conserva por compatibilidad. La sincronización ahora fusiona y nunca borra borradores.
  void userPhone;
}

/**
 * 4. GUARDAR (SYNC): Guarda la carta asociándola al teléfono del técnico
 */
export async function saveSyncedLetter(data: any, userPhone: string): Promise<string> {
  const db = await getDb();
  const t = new Date().toISOString();

  // Verificamos si ya existe para este usuario
  const existing = await db.getFirstAsync<{ local_id: string }>(
    `SELECT local_id FROM local_letters WHERE server_id = ? AND local_user_phone = ?`,
    [String(data.id), userPhone] 
  );

  const status = data.status || 'ASSIGNED';
  const reason = data.return_reason || null;

  if (existing) {
    await db.runAsync(
      `UPDATE local_letters 
       SET slip_id=?, child_code=?, child_name=?, village=?, contact_name=?, due_date=?,
           status=CASE
             WHEN ?='RETURNED' THEN 'RETURNED'
             WHEN status='PENDING_SYNC' THEN status
             ELSE ?
           END,
           return_reason=?, updated_at=?
       WHERE local_id=?`,
      [data.slip_id, data.child_nbr || data.child_code, data.child_name, data.village,
       data.contact_name, data.due_date, status, status, reason, t, existing.local_id]
    );
    return existing.local_id;
  } else {
    const newLocalId = makeLocalId();
    await db.runAsync(
      `INSERT INTO local_letters (
        local_id, server_id, slip_id, child_code, child_name, village, contact_name, due_date,
        status, return_reason, message_content, local_user_phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?)`,
      [
        newLocalId, String(data.id), data.slip_id, data.child_nbr || data.child_code, 
        data.child_name, data.village, data.contact_name, data.due_date, status, reason, 
        userPhone, // ✅ Aquí guardamos al dueño de la carta
        t, t
      ]
    );
    return newLocalId;
  }
}

/**
 * 5. CAMBIAR ESTADO
 */
export async function setLetterStatus(localId: string, status: LetterRow["status"]) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET status = ?, updated_at = datetime('now') WHERE local_id = ?`,
    [status, localId]
  );
}

export async function queueLetterForSync(localId: string) {
  const db = await getDb();
  const submissionId = `${localId}-${Date.now()}`;
  await db.runAsync(
    `UPDATE local_letters
     SET status='PENDING_SYNC', submission_id=?, sync_error=NULL, updated_at=datetime('now')
     WHERE local_id=?`,
    [submissionId, localId]
  );
}

export async function setSyncError(localId: string, error: string | null) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET sync_error=?, updated_at=datetime('now') WHERE local_id=?`,
    [error, localId]
  );
}

/**
 * 6. GUARDAR TEXTO DEL MENSAJE
 */
export async function updateLetterMessage(localId: string, text: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET message_content = ?, updated_at = datetime('now') WHERE local_id = ?`,
    [text, localId]
  );
}
