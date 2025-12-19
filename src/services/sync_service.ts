// src/services/sync_service.ts
import { createLetter } from "../repos/letters_repo";

// IMPORTANTE: Cambia esta URL por la IP de tu servidor local (ej: 192.168.1.50) 
// o tu dominio real. No uses "localhost" si pruebas en un dispositivo físico.
const BASE_URL = "http://localhost/api"; 

export async function syncAssignedLetters(tecnicoId: number) {
  try {
    console.log(`Iniciando sincronización para el técnico: ${tecnicoId}...`);
    
    const response = await fetch(`${BASE_URL}/get_assigned_letters.php?tecnico_id=${tecnicoId}`);
    const assignedLetters = await response.json();

    if (assignedLetters.error) {
        throw new Error(assignedLetters.error);
    }

    if (Array.isArray(assignedLetters)) {
      let nuevas = 0;
      for (const letter of assignedLetters) {
        try {
          // Intentamos insertar en la base de datos local (SQLite)
          // Usamos la función original de tu letters_repo.ts
          await createLetter(letter.local_id, letter.child_code);
          nuevas++;
        } catch (dbError) {
          // Si el ID ya existe localmente, el catch evitará que la app se detenga
          console.log(`La carta ${letter.local_id} ya existe en el móvil.`);
        }
      }
      return { success: true, count: nuevas };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    console.error("Error de red o servidor:", error);
    throw error;
  }

  

  
}

export async function uploadLetterToServer(payload: any) {
  try {
    // IMPORTANTE: Asegúrate de que BASE_URL esté definida arriba
    const response = await fetch(`${BASE_URL}/upload_data.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error subiendo datos:", error);
    throw error;
  }
}