import { getDb } from "../db";

export async function savePhotoLocal(letterId: string, uri: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO photos (letter_id, photo_uri) VALUES (?, ?)
     ON CONFLICT(letter_id) DO UPDATE SET photo_uri = excluded.photo_uri`,
    [letterId, uri]
  );
}

export async function getPhotoLocal(letterId: string) {
  const db = await getDb();
  return db.getFirstAsync<{ photo_uri: string }>(
    `SELECT photo_uri FROM photos WHERE letter_id = ?`,
    [letterId]
  );
}