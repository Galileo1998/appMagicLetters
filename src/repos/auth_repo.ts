import { getDb } from "../db";

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
  is_protected: number; // 0|1
};

export async function getSession(): Promise<SessionRow | null> {
  const db = await getDb();
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

  const user = await db.getFirstAsync<UserRow>(
    `SELECT id, role, name, email, phone, is_protected FROM users WHERE phone=? LIMIT 1;`,
    [phone]
  );
  if (!user) {
    throw new Error("TEL_NO_REGISTRADO");
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO session (id, user_id, logged_in_at) VALUES (1, ?, ?);`,
    [user.id, nowISO()]
  );

  return user;
}

export async function logout() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM session WHERE id=1;`);
}
