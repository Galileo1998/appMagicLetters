// src/repos/letters_repo.ts
import { getDb } from "../db";

function nowISO() {
  return new Date().toISOString();
}

// id simple sin uuid
export function makeLocalId() {
  return `L${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export type LetterRow = {
  local_id: string;
  server_id: string | null;
  child_code: string;
  status: "DRAFT" | "PENDING_SYNC" | "SYNCED";

  text_feelings: string | null;
  text_activities: string | null;
  text_learning: string | null;
  text_share: string | null;
  text_thanks: string | null;

  created_at: string;
  updated_at: string;

  // ✅ computed
  has_message?: number;   // 0 | 1
  photos_count?: number;  // 0..3 (o más si no limitas)
  has_drawing?: number;   // 0 | 1
};

export async function listLetters(params?: {
  onlyDrafts?: boolean;
}): Promise<LetterRow[]> {
  const db = await getDb();
  const onlyDrafts = params?.onlyDrafts ?? false;

  const where = onlyDrafts ? `WHERE ll.status = 'DRAFT'` : ``;

  const rows = await db.getAllAsync<LetterRow>(`
    SELECT
      ll.local_id,
      ll.server_id,
      ll.child_code,
      ll.status,
      ll.text_feelings,
      ll.text_activities,
      ll.text_learning,
      ll.text_share,
      ll.text_thanks,
      ll.created_at,
      ll.updated_at,

      -- ✅ Mensaje (messages)
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM messages m
          WHERE m.letter_id = ll.local_id
        ) THEN 1 ELSE 0
      END AS has_message,

      -- ✅ Fotos (photos)
      (
        SELECT COUNT(*)
        FROM photos p
        WHERE p.letter_id = ll.local_id
      ) AS photos_count,

      -- ✅ Dibujo (drawings)
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM drawings d
          WHERE d.letter_id = ll.local_id
        ) THEN 1 ELSE 0
      END AS has_drawing

    FROM local_letters ll
    ${where}
    ORDER BY ll.updated_at DESC;
  `);

  // Normalizar para que no salgan undefined
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
    `SELECT
      ll.local_id,
      ll.server_id,
      ll.child_code,
      ll.status,
      ll.text_feelings,
      ll.text_activities,
      ll.text_learning,
      ll.text_share,
      ll.text_thanks,
      ll.created_at,
      ll.updated_at,

      CASE
        WHEN EXISTS (
          SELECT 1 FROM messages m
          WHERE m.letter_id = ll.local_id
        ) THEN 1 ELSE 0
      END AS has_message,

      (
        SELECT COUNT(*) FROM photos p
        WHERE p.letter_id = ll.local_id
      ) AS photos_count,

      CASE
        WHEN EXISTS (
          SELECT 1 FROM drawings d
          WHERE d.letter_id = ll.local_id
        ) THEN 1 ELSE 0
      END AS has_drawing

     FROM local_letters ll
     WHERE ll.local_id = ? LIMIT 1`,
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
 * Crea una carta local (borrador).
 * Devuelve local_id.
 */
export async function createLetter(childCode: string): Promise<string> {
  const db = await getDb();
  const id = makeLocalId();
  const t = nowISO();

  await db.runAsync(
    `INSERT INTO local_letters (
        local_id, server_id, child_code, status,
        text_feelings, text_activities, text_learning, text_share, text_thanks,
        created_at, updated_at
     ) VALUES (?, NULL, ?, 'DRAFT', '', '', '', '', '', ?, ?)`,
    [id, childCode.trim(), t, t]
  );

  return id;
}

export async function updateLetterTextFeelings(localId: string, text: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters
     SET text_feelings = ?, updated_at = ?
     WHERE local_id = ?`,
    [text ?? "", nowISO(), localId]
  );
}

export async function setLetterStatus(localId: string, status: LetterRow["status"]) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_letters SET status = ?, updated_at = ? WHERE local_id = ?`,
    [status, nowISO(), localId]
  );
}
