import { queueLetterForSync } from "../repos/letters_repo";
import { syncService } from "./sync_service";

/** Compatibilidad con llamadas antiguas: encola primero y usa el flujo seguro actual. */
export async function uploadLetterToServer(localId: string) {
  await queueLetterForSync(localId);
  return syncService.pushPendingLetters();
}
