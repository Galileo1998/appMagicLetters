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
  status: "DRAFT" | "PENDING_SYNC" | "SYNCED" | "ASSIGNED";

  message_content: string | null; // <--- Único campo ahora

  created_at: string;
  updated_at: string;

  has_message?: number;
  photos_count?: number;
  has_drawing?: number;
};

export async function listLetters(params?: { onlyDrafts?: boolean }): Promise<LetterRow[]> {
  const db = await getDb();
  const where = params?.onlyDrafts 
    ? `WHERE ll.status IN ('DRAFT', 'ASSIGNED', 'PENDING_SYNC')` 
    : ``;

  const rows = await db.getAllAsync<LetterRow>(`
    SELECT ll.*,
      (CASE WHEN length(ll.message_content) > 5 THEN 1 ELSE 0 END) AS has_message,
      (SELECT COUNT(*) FROM photos p WHERE p.letter_id = ll.local_id) AS photos_count,
      (SELECT 1 FROM local_drawings d WHERE d.local_letter_id = ll.local_id) AS has_drawing
    FROM local_letters ll
    ${where}
    ORDER BY 
      CASE WHEN ll.status = 'PENDING_SYNC' THEN 0 ELSE 1 END,
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

export async function saveSyncedLetter(data: any) {
  const db = await getDb();
  const t = new Date().toISOString();

  const existing = await db.getFirstAsync<{ local_id: string }>(
    `SELECT local_id FROM local_letters WHERE server_id = ?`,
    [String(data.id)] 
  );

  if (existing) {
    await db.runAsync(
      `UPDATE local_letters 
       SET slip_id=?, child_name=?, village=?, contact_name=?, due_date=?, updated_at=?
       WHERE local_id=?`,
      [data.slip_id, data.child_name, data.village, data.contact_name, data.due_date, t, existing.local_id]
    );
  } else {
    const newLocalId = makeLocalId();
    await db.runAsync(
      `INSERT INTO local_letters (
        local_id, server_id, slip_id, child_code, child_name, village, contact_name, due_date,
        status, message_content,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', '', ?, ?)`,
      [
        newLocalId, String(data.id), data.slip_id, data.child_nbr || data.child_code, 
        data.child_name, data.village, data.contact_name, data.due_date, t, t
      ]
    );
  }
}

// Actualizar texto libre (Usamos UPDATE directo)
export async function updateLetterMessage(localId: string, text: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET message_content = ?, updated_at = datetime('now') WHERE local_id = ?`,
    [text, localId]
  );
}

export async function setLetterStatus(localId: string, status: LetterRow["status"]) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET status = ?, updated_at = datetime('now') WHERE local_id = ?`,
    [status, localId]
  );
}