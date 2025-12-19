import { getDb } from "../db";

export type PhotoRow = {
  id: number;
  letter_id: string;
  photo_uri: string | null;
  created_at?: string | null;
};

export async function upsertPhoto(letterId: string, photoUri: string) {
  const db = await getDb();

  // 1) verifica que existe la carta
  const exists = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM letters WHERE local_id = ?`,
    [letterId]
  );
  console.log("[PHOTO] letter exists?", letterId, exists?.c);

  try {
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM photos WHERE letter_id = ? LIMIT 1;`,
      [letterId]
    );

    if (existing?.id) {
      await db.runAsync(`UPDATE photos SET photo_uri = ? WHERE letter_id = ?;`, [photoUri, letterId]);
    } else {
      await db.runAsync(`INSERT INTO photos (letter_id, photo_uri) VALUES (?, ?);`, [letterId, photoUri]);
    }

    console.log("[PHOTO] saved OK", letterId);
  } catch (e) {
    console.error("[PHOTO] save failed", e);
    throw e;
  }
}


export async function getPhoto(letterId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ photo_uri: string | null }>(
    `SELECT photo_uri FROM photos WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );
  return row?.photo_uri ?? null;
}

export async function countPhotos(letterId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM photos WHERE letter_id = ?;`,
    [letterId]
  );
  return row?.c ?? 0;
}

export async function clearPhoto(letterId: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM photos WHERE letter_id = ?;`, [letterId]);
}
