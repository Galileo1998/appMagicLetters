// src/repos/photos_repo.ts
import { getDb } from "../db";

export type PhotoRow = {
  id: number; // Ojo: en el schema pusimos TEXT, pero aquí usas number/autoincrement en tu logica anterior.
              // Vamos a adaptarlo a lo que espera tu logica de Slots.
  letter_id: string;
  slot: 1 | 2 | 3;
  file_path: string; // <--- ANTES ERA photo_uri
  created_at: string | null;
  updated_at: string | null;
};

export async function listPhotos(letterId: string): Promise<PhotoRow[]> {
  const db = await getDb();
  // Seleccionamos file_path
  return await db.getAllAsync<PhotoRow>(
    `SELECT id, letter_id, slot, file_path, created_at, updated_at
     FROM photos
     WHERE letter_id = ?
     ORDER BY slot ASC`,
    [letterId]
  );
}

export async function addPhoto(letterId: string, filePath: string): Promise<PhotoRow> {
  const db = await getDb();

  const current = await listPhotos(letterId);
  if (current.length >= 3) {
    throw new Error("Ya tienes 3 fotos guardadas para esta carta.");
  }

  // Lógica para encontrar el slot libre (1, 2 o 3)
  const used = new Set(current.map(p => p.slot));
  const slot = ([1, 2, 3] as const).find(s => !used.has(s))!;
  
  // Guardamos en file_path
  await db.runAsync(
    `INSERT INTO photos (letter_id, slot, file_path, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [letterId, slot, filePath]
  );

  const row = await db.getFirstAsync<PhotoRow>(
    `SELECT id, letter_id, slot, file_path, created_at, updated_at
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