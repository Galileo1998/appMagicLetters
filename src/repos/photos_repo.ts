// src/repos/photos_repo.ts
import { getDb } from "../db";

export type PhotoRow = {
  id: number;
  letter_id: string;
  slot: 1 | 2 | 3;
  photo_uri: string;
  created_at: string | null;
  updated_at: string | null;
};

export async function listPhotos(letterId: string): Promise<PhotoRow[]> {
  const db = await getDb();
  return await db.getAllAsync<PhotoRow>(
    `SELECT id, letter_id, slot, photo_uri, created_at, updated_at
     FROM photos
     WHERE letter_id = ?
     ORDER BY slot ASC`,
    [letterId]
  );
}

export async function addPhoto(letterId: string, photoUri: string): Promise<PhotoRow> {
  const db = await getDb();

  const current = await listPhotos(letterId);
  if (current.length >= 3) {
    throw new Error("Ya tienes 3 fotos guardadas para esta carta.");
  }

  const used = new Set(current.map(p => p.slot));
  const slot = ([1, 2, 3] as const).find(s => !used.has(s))!;
  await db.runAsync(
    `INSERT INTO photos (letter_id, slot, photo_uri, updated_at)
     VALUES (?, ?, ?, datetime('now'))`,
    [letterId, slot, photoUri]
  );

  const row = await db.getFirstAsync<PhotoRow>(
    `SELECT id, letter_id, slot, photo_uri, created_at, updated_at
     FROM photos WHERE letter_id = ? AND slot = ? LIMIT 1`,
    [letterId, slot]
  );

  if (!row) throw new Error("No se pudo leer la foto recién guardada.");
  return row;
}

export async function deletePhoto(letterId: string, slot: 1 | 2 | 3) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM photos WHERE letter_id = ? AND slot = ?`, [letterId, slot]);
}
