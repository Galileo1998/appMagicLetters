import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../db';
import * as lettersRepo from '../repos/letters_repo';

// ⚠️ CONFIRMA QUE ESTA URL APUNTA A DONDE SUBISTE EL ARCHIVO PHP ARRIBA
const BASE_URL = 'https://accionhonduras.org/patrocinio/api'; 
const URL_PULL = `${BASE_URL}/get_assigned_letters.php`;
const URL_PUSH = `${BASE_URL}/upload_letter.php`;

const fixPath = (path: string) => {
  if (!path) return "";
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
};

export const syncService = {
  // --- PULL (Descargar) ---
  async pullAssignedLetters() {
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) return 0; 

      console.log(`⬇️ Pull para: ${phone}`);
      
      const response = await fetch(URL_PULL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone }),
      });

      if (!response.ok) throw new Error(`Error pull: ${response.status}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // 1. Limpiamos cartas viejas
        await lettersRepo.clearLocalLetters(phone); 

        // 2. Guardamos las nuevas
        for (const item of data) {
          // A. Guardar carta normal
          await lettersRepo.saveSyncedLetter(item, phone);

          // B. NUEVO: Si es RETURNED, guardar datos extra para editar
          if (item.status === 'RETURNED' && item.returned_data) {
             console.log(`  🔄 Recuperando datos de devolución: ${item.slip_id}`);
             const db = await getDb();
             // Actualizamos la fila que acabamos de insertar en saveSyncedLetter
             await db.runAsync(
               `UPDATE local_letters SET 
                  prev_message = ?, 
                  prev_photos = ?, 
                  prev_drawing = ? 
                WHERE server_id = ?`, 
               [
                 item.returned_data.message || '', 
                 JSON.stringify(item.returned_data.photos || []), 
                 item.returned_data.drawing || '', 
                 String(item.id) 
               ]
             );
          }
        }
        return data.length;
      }
      return 0;

    } catch (error) {
       console.error("Error Pull:", error);
       throw error;
    }
  },

  // --- PUSH (Tu código original que ya funcionaba) ---
  async pushPendingLetters() {
    const db = await getDb();
    const pendingLetters = await db.getAllAsync<{ local_id: string, server_id: string }>(
      `SELECT local_id, server_id FROM local_letters WHERE status = 'PENDING_SYNC'`
    );

    if (pendingLetters.length === 0) return 0;

    console.log(`⬆️ Subiendo ${pendingLetters.length} cartas...`);
    let uploadedCount = 0;

    for (const letter of pendingLetters) {
      try {
        const formData = new FormData();
        formData.append('server_id', letter.server_id); 

        const letterData = await db.getFirstAsync<{ message_content: string }>(
          `SELECT message_content FROM local_letters WHERE local_id = ?`, [letter.local_id]
        );
        formData.append('message', letterData?.message_content || '');

        const drawRow = await db.getFirstAsync<{ file_path: string }>(
          `SELECT file_path FROM local_drawings WHERE local_letter_id = ?`, [letter.local_id]
        );
        if (drawRow?.file_path) {
          // @ts-ignore
          formData.append('drawing', {
            uri: fixPath(drawRow.file_path), 
            name: `drawing_${letter.server_id}.png`, type: 'image/png',
          });
        }

        const photos = await db.getAllAsync<{ file_path: string }>(
          `SELECT file_path FROM photos WHERE letter_id = ?`, [letter.local_id]
        );
        if (photos) {
           photos.forEach((photo, index) => {
            // @ts-ignore
            formData.append(`photo_${index}`, {
              uri: fixPath(photo.file_path),
              name: `photo_${index}.jpg`, type: 'image/jpeg',
            });
          });
        }

        const response = await fetch(URL_PUSH, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }, // Content-Type se pone solo con FormData
        });

        const textResponse = await response.text();
        const result = JSON.parse(textResponse);
        
        if (result.success) {
          await lettersRepo.setLetterStatus(letter.local_id, 'SYNCED');
          uploadedCount++;
        } 
      } catch (e) {
        console.error(`Error subiendo ${letter.local_id}:`, e);
      }
    }
    return uploadedCount;
  }
};