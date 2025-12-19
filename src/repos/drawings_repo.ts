import { getDb } from "../db";

export type Stroke = {
  d: string;
  color: string;
  width: number;
};

/** Guarda o actualiza el dibujo de una carta */
export async function upsertDrawing(letterId: string, strokes: Stroke[]) {
  const db = await getDb();
  const payload = JSON.stringify(strokes);

  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM drawings WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );

  if (existing?.id) {
    await db.runAsync(
      `UPDATE drawings SET svg_xml = ? WHERE letter_id = ?;`,
      [payload, letterId]
    );
  } else {
    await db.runAsync(
      `INSERT INTO drawings (letter_id, svg_xml) VALUES (?, ?);`,
      [letterId, payload]
    );
  }
}

/** Obtiene el dibujo de una carta */
export async function getDrawing(letterId: string): Promise<Stroke[] | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ svg_xml: string | null }>(
    `SELECT svg_xml FROM drawings WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );

  if (!row?.svg_xml) return null;

  try {
    const parsed = JSON.parse(row.svg_xml);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Indica si una carta tiene dibujo */
export async function hasDrawing(letterId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM drawings WHERE letter_id = ?;`,
    [letterId]
  );
  return (row?.c ?? 0) > 0;
}

/** Elimina el dibujo de una carta */
export async function clearDrawing(letterId: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM drawings WHERE letter_id = ?;`, [letterId]);
}
