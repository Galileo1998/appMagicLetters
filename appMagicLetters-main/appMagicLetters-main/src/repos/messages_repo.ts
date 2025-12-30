// src/repos/messages_repo.ts
import { getDb } from "../db";

export type MessageRow = {
  id: number;
  letter_id: string;
  text: string | null;
  updated_at: string;
};

function assertId(letterId: string) {
  if (!letterId || typeof letterId !== "string") {
    throw new Error(`letterId inválido: ${String(letterId)}`);
  }
}

export async function getMessage(letterId: string): Promise<MessageRow | null> {
  assertId(letterId);
  const db = await getDb();
  const row = await db.getFirstAsync<MessageRow>(
    `SELECT id, letter_id, text, updated_at
     FROM messages
     WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );
  return row ?? null;
}

export async function upsertMessage(letterId: string, text: string) {
  assertId(letterId);
  const db = await getDb();

  // unique index uq_messages_letter_id permite esto:
  await db.runAsync(
    `INSERT INTO messages (letter_id, text, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(letter_id) DO UPDATE SET
       text = excluded.text,
       updated_at = datetime('now');`,
    [letterId, text ?? ""]
  );
}
