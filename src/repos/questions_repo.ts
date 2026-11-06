import { canEditLetter } from "../drawing/model";
import { getDb } from "../db";

export type QuestionRow = {
  id: number;
  question_text: string;
  help_text: string | null;
  sort_order: number;
  is_required: number;
  answer_text?: string;
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
    `SELECT q.*, COALESCE(a.answer_text, '') AS answer_text
     FROM questions q LEFT JOIN letter_answers a
       ON a.question_id=q.id AND a.letter_id=?
     ORDER BY q.sort_order, q.id`,
    [letterId]
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
  return db.getAllAsync<{ question_id: number; question_text: string; answer_text: string }>(
    `SELECT question_id, question_text, answer_text FROM letter_answers WHERE letter_id=?`,
    [letterId]
  );
}

/** Keep answers and message together without changing the upload payload format. */
export async function saveMessageAndAnswers(letterId: string, message: string, questions: QuestionRow[], answers: Record<number, string>) {
  if (!questions.length || !questions.some(q => (answers[q.id] ?? '').trim()) ||
      questions.some(q => q.is_required === 1 && !(answers[q.id] ?? '').trim()) || message.trim().length <= 5) {
    throw new Error('Completa las preguntas y el mensaje.');
  }
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async tx => {
    const letter = await tx.getFirstAsync<{ status: string }>('SELECT status FROM local_letters WHERE local_id=?', [letterId]);
    if (!canEditLetter(letter?.status)) throw new Error('La carta ya está preparada para envío.');
    for (const q of questions) {
      await tx.runAsync(
        `INSERT INTO letter_answers (letter_id, question_id, question_text, answer_text, updated_at)
         VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(letter_id, question_id) DO UPDATE SET
         question_text=excluded.question_text, answer_text=excluded.answer_text, updated_at=datetime('now')`,
        [letterId, q.id, q.question_text, (answers[q.id] ?? '').trim()]);
    }
    await tx.runAsync("UPDATE local_letters SET message_content=?, updated_at=datetime('now') WHERE local_id=?", [message.trim(), letterId]);
  });
}
