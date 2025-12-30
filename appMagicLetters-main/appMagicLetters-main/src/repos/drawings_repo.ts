import { getDb } from "../db";

export type Stroke = {
  path: string;
  color: string;
  width: number;
};

// Guardar un dibujo (Ruta del archivo)
export async function saveDrawingPath(localLetterId: string, filePath: string) {
  const db = await getDb();
  const id = `D${Date.now()}`;
  const now = new Date().toISOString();

  // 1. Borramos si ya existía uno previo para esa carta (para evitar duplicados)
  await db.runAsync(
    `DELETE FROM local_drawings WHERE local_letter_id = ?`,
    [localLetterId]
  );

  // 2. Insertamos el nuevo en la tabla CORRECTA 'local_drawings'
  await db.runAsync(
    `INSERT INTO local_drawings (id, local_letter_id, file_path, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, localLetterId, filePath, now]
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
  await db.runAsync(
    `DELETE FROM local_drawings WHERE local_letter_id = ?`,
    [localLetterId]
  );
}