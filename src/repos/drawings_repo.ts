import { getDb } from "../db";
import * as FileSystem from "expo-file-system/legacy";

export type Stroke = {
  path: string;
  color: string;
  width: number;
};

// Guardar un dibujo (Ruta del archivo)
export async function saveDrawingPath(localLetterId: string, filePath: string, description = "") {
  const db = await getDb();
  const id = `D${Date.now()}`;
  const now = new Date().toISOString();
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error("Almacenamiento local no disponible.");
  const directory = `${base}drawings/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const persistentPath = `${directory}${localLetterId}_${Date.now()}.png`;
  await FileSystem.copyAsync({ from: filePath, to: persistentPath });
  const previous = await db.getFirstAsync<{ file_path: string }>(
    `SELECT file_path FROM local_drawings WHERE local_letter_id=?`,
    [localLetterId]
  );

  // 1. Borramos si ya existía uno previo para esa carta (para evitar duplicados)
  await db.runAsync(
    `DELETE FROM local_drawings WHERE local_letter_id = ?`,
    [localLetterId]
  );

  // 2. Insertamos el nuevo en la tabla CORRECTA 'local_drawings'
  await db.runAsync(
    `INSERT INTO local_drawings (id, local_letter_id, file_path, description, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, localLetterId, persistentPath, description.trim(), now]
  );
  if (previous?.file_path && previous.file_path !== persistentPath) {
    await FileSystem.deleteAsync(previous.file_path, { idempotent: true });
  }
}

export async function getDrawingRecord(localLetterId: string) {
  const db = await getDb();
  return db.getFirstAsync<{ file_path: string; description: string }>(
    `SELECT file_path, description FROM local_drawings WHERE local_letter_id=?`,
    [localLetterId]
  );
}

export async function updateDrawingDescription(localLetterId: string, description: string) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE local_drawings SET description=? WHERE local_letter_id=?`,
    [description.trim(), localLetterId]
  );
}

// Obtener el dibujo (Si existe)
export async function getDrawing(localLetterId: string): Promise<string | null> {
  const db = await getDb();
  
  // Consultamos la tabla CORRECTA 'local_drawings'
  const row = await db.getFirstAsync<{ file_path: string }>(
    `SELECT file_path FROM local_drawings WHERE local_letter_id = ?`,
    [localLetterId]
  );

  return row ? row.file_path : null;
}

// Borrar dibujo
export async function deleteDrawing(localLetterId: string) {
  const db = await getDb();
  const current = await getDrawingRecord(localLetterId);
  await db.runAsync(
    `DELETE FROM local_drawings WHERE local_letter_id = ?`,
    [localLetterId]
  );
  if (current?.file_path) {
    await FileSystem.deleteAsync(current.file_path, { idempotent: true });
  }
}
