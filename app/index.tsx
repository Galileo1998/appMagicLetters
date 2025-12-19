import { getDb } from "../src/db";

export type Stroke = {
  d: string;
  color: string;
  width: number;
};

export async function upsertDrawing(letterId: string, strokes: Stroke[]) {
  const db = await getDb();
  const payload = JSON.stringify(strokes);

  await db.runAsync(
    `INSERT INTO drawings (letter_id, svg_xml, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(letter_id) DO UPDATE SET
       svg_xml=excluded.svg_xml,
       updated_at=datetime('now')`,
    [letterId, payload]
  );
}

export async function getDrawing(letterId: string): Promise<Stroke[] | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ svg_xml: string | null }>(
    `SELECT svg_xml FROM drawings WHERE letter_id = ? LIMIT 1`,
    [letterId]
  );

  if (!row?.svg_xml) return null;

  try {
    const parsed = JSON.parse(row.svg_xml) as Stroke[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
  } catch {
    return null;
  }
}

export async function hasDrawing(letterId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM drawings WHERE letter_id = ?`,
    [letterId]
  );
  return (row?.c ?? 0) > 0;
}

export async function clearDrawing(letterId: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM drawings WHERE letter_id = ?`, [letterId]);
}
