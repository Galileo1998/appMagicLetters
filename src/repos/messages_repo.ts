import { getDb } from "../db";

export type MessageRow = {
  id: number;
  letter_id: string;
  text: string | null;
};

export async function upsertMessage(letterId: string, text: string) {
  const db = await getDb();

  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM messages WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );

  if (existing?.id) {
    await db.runAsync(`UPDATE messages SET text = ? WHERE letter_id = ?;`, [
      text,
      letterId,
    ]);
  } else {
    await db.runAsync(
      `INSERT INTO messages (letter_id, text) VALUES (?, ?);`,
      [letterId, text]
    );
  }
}

export async function getMessage(letterId: string): Promise<MessageRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MessageRow>(
    `SELECT id, letter_id, text FROM messages WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );
  return row ?? null;
}
