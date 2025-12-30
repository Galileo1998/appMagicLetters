import { getDb } from "../db";

function nowISO() {
  return new Date().toISOString();
}

function makeId() {
  return `U${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export type UserRow = {
  id: string;
  role: "ADMIN" | "TECH";
  name: string;
  email: string | null;
  phone: string;
  is_protected: number;
};

export async function listTechs(): Promise<UserRow[]> {
  const db = await getDb();
  return db.getAllAsync<UserRow>(
    `SELECT id, role, name, email, phone, is_protected
     FROM users
     WHERE role='TECH'
     ORDER BY name ASC;`
  );
}

export async function createTech(name: string, phone: string): Promise<string> {
  const db = await getDb();
  const id = makeId();
  const t = nowISO();

  await db.runAsync(
    `INSERT INTO users (id, role, name, email, phone, is_protected, created_at, updated_at)
     VALUES (?, 'TECH', ?, NULL, ?, 0, ?, ?);`,
    [id, name.trim(), phone.trim(), t, t]
  );

  return id;
}

// Opcional: borrar técnicos (admin), PERO nunca admin protegido
export async function deleteUser(userId: string) {
  const db = await getDb();
  const u = await db.getFirstAsync<{ is_protected: number }>(
    `SELECT is_protected FROM users WHERE id=? LIMIT 1;`,
    [userId]
  );
  if (!u) return;
  if ((u.is_protected ?? 0) === 1) throw new Error("NO_SE_PUEDE_BORRAR_PROTEGIDO");
  await db.runAsync(`DELETE FROM users WHERE id=?;`, [userId]);
}
