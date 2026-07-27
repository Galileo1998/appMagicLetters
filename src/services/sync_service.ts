import * as FileSystem from "expo-file-system/legacy";
import { getDb } from "../db";
import { getDrawingRecord } from "../repos/drawings_repo";
import { getMe } from "../repos/auth_repo";
import * as lettersRepo from "../repos/letters_repo";
import { listPhotos, upsertReturnedPhoto } from "../repos/photos_repo";
import { listAnswers, replaceQuestions } from "../repos/questions_repo";
import { apiFetch } from "./api";

function asFileUri(path: string) {
  return path.startsWith("file://") ? path : `file://${path}`;
}

async function cacheRemoteFile(url: string, prefix: string) {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error("Almacenamiento local no disponible");
  const directory = `${base}returned/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const extension = url.split("?")[0].split(".").pop() || "jpg";
  const target = `${directory}${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}.${extension}`;
  const result = await FileSystem.downloadAsync(url, target);
  return result.uri;
}

export const syncService = {
  async pullAssignedLetters() {
    const response = await apiFetch("get_assigned_letters.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `Error de descarga (${response.status})`);

    await replaceQuestions(Array.isArray(payload.questions) ? payload.questions : []);
    const letters = Array.isArray(payload.letters) ? payload.letters : [];
    const me = await getMe();
    if (!me) throw new Error("No hay una sesión local activa");

    for (const item of letters) {
      const localId = await lettersRepo.saveSyncedLetter(item, me.phone);
      if (item.status !== "RETURNED" || !item.returned_data) continue;

      const db = await getDb();
      const returned = item.returned_data;
      if (typeof returned.message === "string" && returned.message !== "") {
        await lettersRepo.updateLetterMessage(localId, returned.message);
      }
      if (returned.drawing?.url) {
        const path = await cacheRemoteFile(returned.drawing.url, `drawing_${item.id}`);
        await db.runAsync(`DELETE FROM local_drawings WHERE local_letter_id=?`, [localId]);
        await db.runAsync(
          `INSERT INTO local_drawings (id, local_letter_id, file_path, description, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [`RD${Date.now()}`, localId, path, returned.drawing.description ?? ""]
        );
      }
      if (Array.isArray(returned.photos)) {
        for (let index = 0; index < returned.photos.length && index < 3; index++) {
          const photo = returned.photos[index];
          if (!photo?.url) continue;
          const path = await cacheRemoteFile(photo.url, `photo_${item.id}_${index + 1}`);
          await upsertReturnedPhoto(localId, index + 1, path, photo.description ?? "");
        }
        await db.runAsync(`DELETE FROM photos WHERE letter_id=? AND slot>?`, [localId, returned.photos.length]);
      }
      if (Array.isArray(returned.answers)) {
        for (const answer of returned.answers) {
          await db.runAsync(
            `INSERT INTO letter_answers (letter_id, question_id, question_text, answer_text, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(letter_id, question_id) DO UPDATE SET answer_text=excluded.answer_text,
               question_text=excluded.question_text, updated_at=datetime('now')`,
            [localId, Number(answer.question_id), answer.question_text, answer.answer_text]
          );
        }
      }
    }
    return letters.length;
  },

  async pushPendingLetters() {
    const db = await getDb();
    const pending = await db.getAllAsync<{
      local_id: string;
      server_id: string;
      submission_id: string | null;
      message_content: string | null;
    }>(
      `SELECT local_id, server_id, submission_id, message_content
       FROM local_letters WHERE status='PENDING_SYNC' ORDER BY updated_at`
    );

    let uploaded = 0;
    let failed = 0;
    for (const letter of pending) {
      try {
        const submissionId = letter.submission_id || `${letter.local_id}-${Date.now()}`;
        if (!letter.submission_id) {
          await db.runAsync(`UPDATE local_letters SET submission_id=? WHERE local_id=?`, [submissionId, letter.local_id]);
        }

        const form = new FormData();
        form.append("server_id", letter.server_id);
        form.append("submission_id", submissionId);
        form.append("message", letter.message_content ?? "");

        const drawing = await getDrawingRecord(letter.local_id);
        if (drawing) {
          form.append("drawing_description", drawing.description);
          form.append("drawing", {
            uri: asFileUri(drawing.file_path),
            name: `drawing_${letter.server_id}.png`,
            type: "image/png",
          } as any);
        }

        const descriptions: Record<string, string> = {};
        const photos = await listPhotos(letter.local_id);
        photos.forEach((photo, index) => {
          const key = `photo_${index}`;
          descriptions[key] = photo.description;
          form.append(key, {
            uri: asFileUri(photo.file_path),
            name: `${key}.jpg`,
            type: "image/jpeg",
          } as any);
        });
        form.append("photo_descriptions", JSON.stringify(descriptions));
        form.append("answers", JSON.stringify(await listAnswers(letter.local_id)));

        const response = await apiFetch("upload_letter.php", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || `Error de envío (${response.status})`);
        }
        await lettersRepo.setLetterStatus(letter.local_id, "SYNCED");
        await lettersRepo.setSyncError(letter.local_id, null);
        uploaded++;
      } catch (error: any) {
        await lettersRepo.setSyncError(letter.local_id, error?.message ?? "Error desconocido");
        failed++;
      }
    }
    return { uploaded, failed };
  },
};
