// src/repos/photos_repo.ts
// 👇 CORRECCIÓN AQUÍ: Agregamos '/legacy' para usar los métodos antiguos sin error
import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from "../db";

export type PhotoRow = {
  id: number;
  letter_id: string;
  slot: 1 | 2 | 3;
  file_path: string;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Lista las fotos asociadas a una carta.
 */
export async function listPhotos(letterId: string): Promise<PhotoRow[]> {
  const db = await getDb();
  return await db.getAllAsync<PhotoRow>(
    `SELECT id, letter_id, slot, file_path, created_at, updated_at
     FROM photos
     WHERE letter_id = ?
     ORDER BY slot ASC`,
    [letterId]
  );
}

/**
 * Guarda una foto (desde Cámara o Galería) en la memoria interna y registra en BD.
 */
export async function addPhoto(letterId: string, sourceUri: string): Promise<PhotoRow> {
  const db = await getDb();

  // 1. Verificar Slots disponibles
  const current = await listPhotos(letterId);
  if (current.length >= 3) {
    throw new Error("Ya tienes 3 fotos guardadas para esta carta (Límite alcanzado).");
  }

  // 2. Calcular cuál slot está libre (1, 2 o 3)
  const used = new Set(current.map(p => p.slot));
  const slot = ([1, 2, 3] as const).find(s => !used.has(s));

  if (!slot) {
    throw new Error("Error calculando el slot de la foto.");
  }

  // 3. COPIAR LA IMAGEN A CARPETA SEGURA
  const fileName = `photo_${letterId}_slot${slot}_${Date.now()}.jpg`;
  // documentDirectory sigue existiendo en legacy
  const newPath = `${FileSystem.documentDirectory}${fileName}`;

  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: newPath
    });
  } catch (error) {
    console.error("Error copiando archivo:", error);
    // Agregamos el detalle del error para debugging
    throw new Error(`No se pudo guardar la imagen. Detalle: ${error}`);
  }

  // 4. Insertar en Base de Datos
  await db.runAsync(
    `INSERT INTO photos (letter_id, slot, file_path, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [letterId, slot, newPath]
  );

  // 5. Retornar el objeto insertado
  const row = await db.getFirstAsync<PhotoRow>(
    `SELECT id, letter_id, slot, file_path, created_at, updated_at
     FROM photos WHERE letter_id = ? AND slot = ? LIMIT 1`,
    [letterId, slot]
  );

  if (!row) throw new Error("Error recuperando la foto guardada.");
  return row;
}

/**
 * Elimina una foto de la base de datos Y del sistema de archivos.
 */
export async function deletePhoto(letterId: string, slot: 1 | 2 | 3) {
  const db = await getDb();

  // 1. Obtener la ruta
  const row = await db.getFirstAsync<{ file_path: string }>(
    `SELECT file_path FROM photos WHERE letter_id = ? AND slot = ?`,
    [letterId, slot]
  );

  if (row && row.file_path) {
    try {
      await FileSystem.deleteAsync(row.file_path, { idempotent: true });
    } catch (e) {
      console.warn("No se pudo borrar el archivo físico:", e);
    }
  }

  // 2. Borrar de BD
  await db.runAsync(`DELETE FROM photos WHERE letter_id = ? AND slot = ?`, [letterId, slot]);
}