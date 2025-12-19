// src/repos/drawings_repo.ts
import { getDb } from "../db";

export type Stroke = {
  d: string;
  color: string;
  width: number;
};

function assertId(letterId: string) {
  if (!letterId || typeof letterId !== "string") {
    throw new Error(`letterId inválido: ${String(letterId)}`);
  }
}

export async function getDrawing(letterId: string): Promise<Stroke[] | null> {
  assertId(letterId);
  const db = await getDb();
  const row = await db.getFirstAsync<{ svg_xml: string | null }>(
    `SELECT svg_xml FROM drawings WHERE letter_id = ? LIMIT 1;`,
    [letterId]
  );

  if (!row?.svg_xml) return null;

  try {
    const parsed = JSON.parse(row.svg_xml) as Stroke[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(Boolean);
  } catch {
    return null;
  }
}

export async function upsertDrawing(letterId: string, strokes: Stroke[]) {
  assertId(letterId);
  const db = await getDb();

  await db.runAsync(
    `INSERT INTO drawings (letter_id, svg_xml, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(letter_id) DO UPDATE SET
       svg_xml = excluded.svg_xml,
       updated_at = datetime('now');`,
    [letterId, JSON.stringify(strokes ?? [])]
  );
}

export async function clearDrawing(letterId: string) {
  assertId(letterId);
  const db = await getDb();
  await db.runAsync(`DELETE FROM drawings WHERE letter_id = ?;`, [letterId]);
}
