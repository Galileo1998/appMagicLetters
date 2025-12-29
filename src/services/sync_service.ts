import AsyncStorage from '@react-native-async-storage/async-storage';
import * as lettersRepo from '../repos/letters_repo';

// ⚠️ IMPORTANTE: Cambia esta IP por la de tu servidor (ej. 192.168.1.X)
// Usa 10.0.2.2 si estás en el emulador de Android
const API_URL = 'http://192.168.1.64:8081/magicletter/api/get_assigned_letters.php';

export const syncService = {
  
  async pullAssignedLetters() {
    try {
      // 1. Obtener teléfono del usuario (guardado en Login)
      const phone = await AsyncStorage.getItem('user_phone');
      
      if (!phone) {
        console.warn("⚠️ No hay teléfono de usuario, omitiendo sync.");
        return;
      }

      console.log(`🔄 Sincronizando para: ${phone}...`);

      // 2. Llamar al servidor PHP
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone }),
      });

      if (!response.ok) {
        throw new Error(`Error servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error("❌ Error API:", data.error);
        return;
      }

      // 3. Guardar en SQLite
      if (Array.isArray(data)) {
        console.log(`✅ Recibidas ${data.length} cartas.`);
        for (const item of data) {
          await lettersRepo.saveSyncedLetter(item);
        }
        return data.length;
      }

    } catch (error) {
      console.error("❌ Error de red:", error);
      throw error;
    }
  }
};