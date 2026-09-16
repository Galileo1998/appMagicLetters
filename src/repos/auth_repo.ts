import { getDb } from "../db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../services/api";
import NetInfo from "@react-native-community/netinfo";

function nowISO() {
  return new Date().toISOString();
}

export type SessionRow = { user_id: string };

export type UserRow = {
  id: string;
  role: "ADMIN" | "TECH";
  name: string;
  email: string | null;
  phone: string;
  is_protected: number; 
};

export async function getSession(): Promise<SessionRow | null> {
  const db = await getDb();
  // Busca la sesión activa en la tabla 'session' (singular)
  const row = await db.getFirstAsync<SessionRow>(`SELECT user_id FROM session WHERE id=1;`);
  return row ?? null;
}

export async function getMe(): Promise<UserRow | null> {
  const db = await getDb();
  const s = await getSession();
  if (!s) return null;
  const me = await db.getFirstAsync<UserRow>(
    `SELECT id, role, name, email, phone, is_protected FROM users WHERE id=? LIMIT 1;`,
    [s.user_id]
  );
  return me ?? null;
}

export async function loginByPhone(phoneRaw: string): Promise<UserRow> {
  const db = await getDb();
  const phone = phoneRaw.trim();

  // 1. Buscamos el usuario
  const user = await db.getFirstAsync<UserRow>(
    `SELECT id, role, name, email, phone, is_protected FROM users WHERE phone=? LIMIT 1;`,
    [phone]
  );
  
  if (!user) {
    throw new Error("TEL_NO_REGISTRADO");
  }

  // 2. Creamos la sesión
  await db.runAsync(
    `INSERT OR REPLACE INTO session (id, user_id, logged_in_at) VALUES (1, ?, ?);`,
    [user.id, nowISO()]
  );

  return user;
}

export async function saveAuthenticatedUser(user: {
  id: string;
  name: string;
  phone: string;
  role: "TECH";
}): Promise<UserRow> {
  const db = await getDb();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO users (id, role, name, email, phone, is_protected, created_at, updated_at)
     VALUES (?, 'TECH', ?, NULL, ?, 0, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone, updated_at=excluded.updated_at`,
    [user.id, user.name, user.phone, now, now]
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO session (id, user_id, logged_in_at) VALUES (1, ?, ?)`,
    [user.id, now]
  );
  return (await getMe())!;
}

// === CAMBIO IMPORTANTE AQUÍ ===

// Función 1: Solo cierra la sesión (NO borra cartas)
export async function getLogoutBlockReason(userPhone?: string | null): Promise<string | null> {
  const network = await NetInfo.fetch();
  const online = network.isConnected === true && network.isInternetReachable !== false;
  if (!online) {
    return "No puedes cerrar sesión sin conexión. Conserva la sesión para seguir trabajando en campo.";
  }

  const db = await getDb();
  const pending = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM local_letters
     WHERE status='PENDING_SYNC' AND (? IS NULL OR local_user_phone=?)`,
    [userPhone ?? null, userPhone ?? null]
  );
  if (Number(pending?.total ?? 0) > 0) {
    return `Tienes ${Number(pending?.total)} carta(s) pendiente(s) de subir. Sincroniza antes de cerrar sesión.`;
  }
  return null;
}

export async function logout(options: { force?: boolean; userPhone?: string | null } = {}) {
  if (!options.force) {
    const reason = await getLogoutBlockReason(options.userPhone);
    if (reason) throw new Error(reason);
  }
  const db = await getDb();
  try {
    const response = await apiFetch("logout.php", { method: "POST" }, 20_000);
    if (!response.ok && !options.force) throw new Error("El servidor no confirmó el cierre de sesión.");
  } catch {
    if (!options.force) {
      throw new Error("La conexión falló. Por seguridad, la sesión permanece abierta en la aplicación.");
    }
  }
  await db.runAsync(`DELETE FROM session WHERE id=1;`);
  await AsyncStorage.multiRemove(["api_token", "user_phone", "user_id"]);
}

// Función 2: Borra los datos locales (Solo se usa si cambia el técnico)
export async function wipeUserData() {
  const db = await getDb();
  try {
    console.log("🧹 Borrando datos del usuario anterior...");
    await db.runAsync('DELETE FROM local_letters');
    await db.runAsync('DELETE FROM local_drawings');
    await db.runAsync('DELETE FROM sync_queue');
  } catch (e) {
    console.error("Error limpiando datos:", e);
  }
}
