import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../db';
import * as lettersRepo from '../repos/letters_repo';

// ⚠️ Asegúrate de que esta IP sea la correcta de tu servidor
const BASE_URL = 'https://accionhonduras.org/patrocinio/api'; 
const URL_PULL = `${BASE_URL}/get_assigned_letters.php`;
const URL_PUSH = `${BASE_URL}/upload_letter.php`;

const fixPath = (path: string) => {
  if (!path) return "";
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
};

export const syncService = {
  async pullAssignedLetters() {
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) return 0; // Sin teléfono no hay paraíso

      console.log(`⬇️ Pull para: ${phone}`);
      
      const response = await fetch(URL_PULL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone }),
      });

      if (!response.ok) throw new Error(`Error pull: ${response.status}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // 1. Limpiamos SOLO las de este usuario
        await lettersRepo.clearLocalLetters(phone); 

        // 2. Guardamos pasando el teléfono
        for (const item of data) {
          await lettersRepo.saveSyncedLetter(item, phone);
        }
        return data.length;
      }
      return 0;

    } catch (error) {
       // ... manejo de error
       throw error;
    }
  },
  // --- PUSH (Subir) ---
  async pushPendingLetters() {
    const db = await getDb();
    
    // Buscar cartas marcadas como pendientes
    const pendingLetters = await db.getAllAsync<{ local_id: string, server_id: string }>(
      `SELECT local_id, server_id FROM local_letters WHERE status = 'PENDING_SYNC'`
    );

    if (pendingLetters.length === 0) return 0;

    console.log(`⬆️ Procesando ${pendingLetters.length} cartas para subir...`);
    let uploadedCount = 0;

    for (const letter of pendingLetters) {
      try {
        console.log(`📦 Empaquetando carta Local: ${letter.local_id} -> Server: ${letter.server_id}`);
        
        const formData = new FormData();
        formData.append('server_id', letter.server_id); 

        // 1. OBTENER MENSAJE (CORREGIDO PARA DB NUEVA)
        const letterData = await db.getFirstAsync<{ message_content: string }>(
          `SELECT message_content FROM local_letters WHERE local_id = ?`, 
          [letter.local_id]
        );

        // Enviamos el contenido tal cual. Si está vacío, enviamos string vacía.
        const msgToSend = letterData?.message_content || '';
        formData.append('message', msgToSend);
        console.log(`   📝 Mensaje adjuntado (${msgToSend.length} caracteres)`);

        // 2. OBTENER DIBUJO
        const drawRow = await db.getFirstAsync<{ file_path: string }>(
          `SELECT file_path FROM local_drawings WHERE local_letter_id = ?`, [letter.local_id]
        );
        
        if (drawRow?.file_path) {
          const cleanPath = fixPath(drawRow.file_path);
          console.log(`   🎨 Dibujo encontrado: ${cleanPath}`);
          // @ts-ignore
          formData.append('drawing', {
            uri: cleanPath, 
            name: `drawing_${letter.server_id}.png`,
            type: 'image/png',
          });
        }

        // 3. OBTENER FOTOS
        const photos = await db.getAllAsync<{ file_path: string }>(
          `SELECT file_path FROM photos WHERE letter_id = ?`, [letter.local_id]
        );
        
        if (photos && photos.length > 0) {
           console.log(`   📸 Encontradas ${photos.length} fotos.`);
           photos.forEach((photo, index) => {
            const cleanPath = fixPath(photo.file_path);
            // @ts-ignore
            formData.append(`photo_${index}`, {
              uri: cleanPath,
              name: `photo_${index}.jpg`,
              type: 'image/jpeg',
            });
          });
        }

        // 4. ENVIAR
        console.log("   🚀 Enviando request...");
        const response = await fetch(URL_PUSH, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        const textResponse = await response.text();
        console.log("   📡 Respuesta RAW:", textResponse);

        try {
            const result = JSON.parse(textResponse);
            if (result.success) {
              await lettersRepo.setLetterStatus(letter.local_id, 'SYNCED');
              uploadedCount++;
              console.log(`   ✅ SUBIDA EXITOSA.`);
            } else {
              console.error(`   ❌ Error del servidor:`, result.error);
            }
        } catch(e) {
            console.error("   ❌ Error JSON:", e);
        }

      } catch (e) {
        console.error(`   ❌ Error Excepción:`, e);
      }
    }

    return uploadedCount;
  }
};