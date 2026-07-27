// src/repos/photos_repo.ts
import { getDb } from "../db";
import * as FileSystem from "expo-file-system/legacy";

export type PhotoRow = {
  id: number; // Ojo: en el schema pusimos TEXT, pero aquí usas number/autoincrement en tu logica anterior.
              // Vamos a adaptarlo a lo que espera tu logica de Slots.
  letter_id: string;
  slot: 1 | 2 | 3;
  file_path: string; // <--- ANTES ERA photo_uri
  description: string;
  created_at: string | null;
  updated_at: string | null;
};

async function editablePhotoDb(letterId: string) {
  const db = await getDb();
  const letter = await db.getFirstAsync<{ status: string }>(
    `SELECT status FROM local_letters WHERE local_id=? LIMIT 1`,
    [letterId]
  );
  if (!letter) throw new Error("La carta no existe.");
  if (!["DRAFT", "ASSIGNED", "RETURNED"].includes(letter.status)) {
    throw new Error("El paquete ya fue preparado y las fotografías están bloqueadas.");
  }
  return db;
}

export async function listPhotos(letterId: string): Promise<PhotoRow[]> {
  const db = await getDb();
  // Seleccionamos file_path
  return await db.getAllAsync<PhotoRow>(
    `SELECT id, letter_id, slot, file_path, description, created_at, updated_at
     FROM photos
     WHERE letter_id = ?
     ORDER BY slot ASC`,
    [letterId]
  );
}

export async function addPhoto(letterId: string, filePath: string, description = ""): Promise<PhotoRow> {
  const db = await editablePhotoDb(letterId);

  const current = await listPhotos(letterId);
  if (current.length >= 3) {
    throw new Error("Ya tienes 3 fotos guardadas para esta carta.");
  }

  // Lógica para encontrar el slot libre (1, 2 o 3)
  const used = new Set(current.map(p => p.slot));
  const slot = ([1, 2, 3] as const).find(s => !used.has(s))!;
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error("Almacenamiento local no disponible.");
  const directory = `${base}photos/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const persistentPath = `${directory}${letterId}_${slot}_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: filePath, to: persistentPath });
  
  // Guardamos en file_path
  await db.runAsync(
    `INSERT INTO photos (letter_id, slot, file_path, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [letterId, slot, persistentPath, description]
  );

  const row = await db.getFirstAsync<PhotoRow>(
    `SELECT id, letter_id, slot, file_path, description, created_at, updated_at
     FROM photos WHERE letter_id = ? AND slot = ? LIMIT 1`,
    [letterId, slot]
  );

  if (!row) throw new Error("No se pudo leer la foto recién guardada.");
  return row;
}

export async function updatePhotoDescription(letterId: string, slot: number, description: string) {
  const db = await editablePhotoDb(letterId);
  await db.runAsync(
    `UPDATE photos SET description=?, updated_at=datetime('now') WHERE letter_id=? AND slot=?`,
    [description.trim(), letterId, slot]
  );
}

export async function upsertReturnedPhoto(letterId: string, slot: number, filePath: string, description: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO photos (letter_id, slot, file_path, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(letter_id, slot) DO UPDATE SET file_path=excluded.file_path,
       description=excluded.description, updated_at=datetime('now')`,
    [letterId, slot, filePath, description]
  );
}

export async function deletePhoto(letterId: string, slot: 1 | 2 | 3) {
  const db = await editablePhotoDb(letterId);
  const photo = await db.getFirstAsync<{ file_path: string }>(
    `SELECT file_path FROM photos WHERE letter_id=? AND slot=?`,
    [letterId, slot]
  );
  await db.runAsync(`DELETE FROM photos WHERE letter_id = ? AND slot = ?`, [letterId, slot]);
  if (photo?.file_path) {
    await FileSystem.deleteAsync(photo.file_path, { idempotent: true });
  }
}
