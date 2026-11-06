import { canEditLetter, DrawingState } from "../drawing/model";
import { getDb } from "../db";
import * as FileSystem from "expo-file-system/legacy";

export type Stroke = {
  path: string;
  color: string;
  width: number;
};

// Guardar un dibujo (Ruta del archivo)
export async function saveDrawingPath(localLetterId: string, filePath: string, description = "", editorState?: DrawingState) {
  const db = await getDb();
  const id = `D${Date.now()}`;
  const now = new Date().toISOString();
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error("Almacenamiento local no disponible.");
  const directory = `${base}drawings/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const persistentPath = `${directory}${localLetterId}_${Date.now()}.png`;
  await FileSystem.copyAsync({ from: filePath, to: persistentPath });
  let previous: { file_path: string } | null = null;
  try {
    await db.withExclusiveTransactionAsync(async (tx) => {
      const letter = await tx.getFirstAsync<{ status: string }>('SELECT status FROM local_letters WHERE local_id=?', [localLetterId]);
      if (!canEditLetter(letter?.status)) throw new Error('La carta ya está preparada para envío.');
      previous = await tx.getFirstAsync<{ file_path: string }>('SELECT file_path FROM local_drawings WHERE local_letter_id=?', [localLetterId]);
      await tx.runAsync('DELETE FROM local_drawings WHERE local_letter_id=?', [localLetterId]);
      await tx.runAsync(
        'INSERT INTO local_drawings (id, local_letter_id, file_path, description, created_at, editor_state) VALUES (?, ?, ?, ?, ?, ?)',
        [id, localLetterId, persistentPath, description.trim(), now, editorState ? JSON.stringify(editorState) : null]
      );
    });
  } catch (error) {
    await FileSystem.deleteAsync(persistentPath, { idempotent: true });
    throw error;
  }
  const oldPath = (previous as { file_path: string } | null)?.file_path;
  if (oldPath && oldPath !== editorState?.baseImage) {
    await FileSystem.deleteAsync(oldPath, { idempotent: true }).catch(() => undefined);
  }
}

export async function getDrawingRecord(localLetterId: string) {
  const db = await getDb();
  return db.getFirstAsync<{ file_path: string; description: string; editor_state: string | null }>(
    `SELECT file_path, description, editor_state FROM local_drawings WHERE local_letter_id=?`,
    [localLetterId]
  );
}

export async function updateDrawingDescription(localLetterId: string, description: string) {
  const db = await getDb();
  const letter = await db.getFirstAsync<{ status: string }>('SELECT status FROM local_letters WHERE local_id=?', [localLetterId]);
  if (!canEditLetter(letter?.status)) throw new Error('La carta ya está preparada para envío.');
  await db.runAsync(
    `UPDATE local_drawings SET description=? WHERE local_letter_id=? AND EXISTS (SELECT 1 FROM local_letters WHERE local_id=local_letter_id AND status IN ('DRAFT','ASSIGNED','RETURNED'))`,
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
  const letter = await db.getFirstAsync<{ status: string }>('SELECT status FROM local_letters WHERE local_id=?', [localLetterId]);
  if (!canEditLetter(letter?.status)) throw new Error('La carta ya está preparada para envío.');
  const current = await getDrawingRecord(localLetterId);
  const result = await db.runAsync(
    `DELETE FROM local_drawings WHERE local_letter_id = ? AND EXISTS (SELECT 1 FROM local_letters WHERE local_id=local_letter_id AND status IN ('DRAFT','ASSIGNED','RETURNED'))`,
    [localLetterId]
  );
  if (result.changes > 0 && current?.file_path) {
    await FileSystem.deleteAsync(current.file_path, { idempotent: true });
  }
}
