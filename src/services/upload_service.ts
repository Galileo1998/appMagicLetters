// src/services/upload_service.ts
import { getDrawing } from "../../app/index"; // Importado de tu archivo app/index.tsx
import { getLetter } from "../repos/letters_repo";

const UPLOAD_URL = "https://tu-dominio.com/upload_letter_data.php";

export async function uploadLetterToServer(localId: string) {
  try {
    // 1. Obtener los datos actuales de SQLite local
    const letter = await getLetter(localId); //
    const drawingStrokes = await getDrawing(localId); //

    if (!letter) throw new Error("Carta no encontrada localmente");

    // 2. Preparar el paquete de datos
    const payload = {
      local_id: letter.local_id,
      text_feelings: letter.text_feelings,
      drawing: JSON.stringify(drawingStrokes), // Convertimos los trazos a string
      // Aquí podrías agregar fotos y mensajes siguiendo la misma lógica
    };

    // 3. Enviar al servidor PHP
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      console.log("Sincronización exitosa con la web");
      // Opcional: Borrar de SQLite local o cambiar estado a 'SYNCED'
    }
  } catch (error) {
    console.error("Error al subir la carta:", error);
  }
}