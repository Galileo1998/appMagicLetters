import { getDb } from "../db";


function makeLocalId() {
  return `L${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}


export type LetterRow = {
  local_id: string;
  child_code: string;
  status: string;
  text_feelings: string | null;
  created_at: string;
  updated_at: string | null;
};
export async function listLetters(): Promise<LetterRow[]> {
  const db = await getDb();
  return db.getAllAsync<LetterRow>(
    `SELECT local_id, child_code, status, text_feelings, created_at, updated_at
     FROM letters
     ORDER BY COALESCE(updated_at, created_at) DESC`
  );
}

export async function getLetter(localId: string): Promise<LetterRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LetterRow>(
    `SELECT local_id, child_code, status, text_feelings, created_at, updated_at
     FROM letters
     WHERE local_id = ?`,
    [localId]
  );
  return row ?? null;
}


function nowISO() {
  return new Date().toISOString();
}


export async function createLetter(localId: string, childCode: string): Promise<string> {
  const db = await getDb();

  const code = (childCode ?? "").trim();
  if (!localId) throw new Error("createLetter: localId vacío");
  if (!code) throw new Error("createLetter: childCode vacío");

  const t = nowISO();

  // OJO: aquí child_code SIEMPRE va con `code`
  await db.runAsync(
    `INSERT INTO letters (local_id, child_code, status, text_feelings, created_at, updated_at)
     VALUES (?, ?, 'DRAFT', '', ?, ?)`,
    [localId, code, t, t]
  );

  return localId;
}



export async function updateLetterTextFeelings(localId: string, text: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE letters SET text_feelings = ?, updated_at = ?
     WHERE local_id = ?`,
    [text ?? "", nowISO(), localId]
  );
}

export async function setLetterStatus(localId: string, status: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE letters SET status = ?, updated_at = ? WHERE local_id = ?`,
    [status, nowISO(), localId]
  );
}
