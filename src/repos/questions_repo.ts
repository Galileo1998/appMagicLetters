import { canEditLetter } from "../drawing/model";
import { getDb } from "../db";

export type QuestionRow = {
  id: number;
  question_text: string;
  help_text: string | null;
  sort_order: number;
  is_required: number;
  answer_text?: string;
  answer_in_message?: number;
};

export async function replaceQuestions(items: any[]) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const ids: number[] = [];
    for (const item of items) {
      const id = Number(item.id);
      if (!id) continue;
      ids.push(id);
      await db.runAsync(
        `INSERT INTO questions (id, question_text, help_text, sort_order, is_required, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET question_text=excluded.question_text,
           help_text=excluded.help_text, sort_order=excluded.sort_order,
           is_required=excluded.is_required, updated_at=excluded.updated_at`,
        [id, item.question_text, item.help_text ?? null, Number(item.sort_order ?? 0),
         Number(item.is_required ?? 1), item.updated_at ?? null]
      );
    }
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      await db.runAsync(`DELETE FROM questions WHERE id NOT IN (${placeholders})`, ids);
    } else {
      await db.runAsync(`DELETE FROM questions`);
    }
  });
}

export async function listQuestionsForLetter(letterId: string): Promise<QuestionRow[]> {
  const db = await getDb();
  return db.getAllAsync<QuestionRow>(
    `SELECT q.id, COALESCE(a.question_text, q.question_text) AS question_text, q.help_text, q.sort_order, q.is_required,
       COALESCE(a.answer_text, '') AS answer_text, COALESCE(a.answer_in_message, 0) AS answer_in_message
     FROM questions q LEFT JOIN letter_answers a
       ON a.question_id=q.id AND a.letter_id=?
     UNION ALL
     SELECT a.question_id AS id, a.question_text, NULL AS help_text, 2147483647 AS sort_order,
       0 AS is_required, a.answer_text, a.answer_in_message
     FROM letter_answers a WHERE a.letter_id=? AND a.answer_in_message=1
       AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.id=a.question_id)
     ORDER BY sort_order, id`,
    [letterId, letterId]
  );
}

export async function saveAnswer(letterId: string, question: QuestionRow, answer: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO letter_answers (letter_id, question_id, question_text, answer_text, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(letter_id, question_id) DO UPDATE SET question_text=excluded.question_text,
       answer_text=excluded.answer_text, updated_at=datetime('now')`,
    [letterId, question.id, question.question_text, answer.trim()]
  );
}

export async function listAnswers(letterId: string) {
  const db = await getDb();
  return db.getAllAsync<{ question_id: number; question_text: string; answer_text: string; answer_in_message: number }>(
    `SELECT question_id, question_text, answer_text, answer_in_message FROM letter_answers WHERE letter_id=? AND (answer_in_message=1 OR length(trim(answer_text))>0)`,
    [letterId]
  );
}

/** Store the selected prompt; its response is the complete letter message. */
export async function saveQuestionAndMessage(letterId: string, message: string, question: QuestionRow | null) {
  if (!question || !Number.isInteger(question.id) || question.id <= 0 || !question.question_text.trim() || message.trim().length <= 5) {
    throw new Error('Selecciona una pregunta y redacta el mensaje completo.');
  }
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async tx => {
    const letter = await tx.getFirstAsync<{ status: string }>('SELECT status FROM local_letters WHERE local_id=?', [letterId]);
    if (!canEditLetter(letter?.status)) throw new Error('La carta ya está preparada para envío.');
    await tx.runAsync('DELETE FROM letter_answers WHERE letter_id=?', [letterId]);
    await tx.runAsync(
      `INSERT INTO letter_answers (letter_id, question_id, question_text, answer_text, answer_in_message, updated_at)
       VALUES (?, ?, ?, '', 1, datetime('now'))`, [letterId, question.id, question.question_text]);
    await tx.runAsync("UPDATE local_letters SET message_content=?, content_version=2, updated_at=datetime('now') WHERE local_id=?", [message.trim(), letterId]);
  });
}
