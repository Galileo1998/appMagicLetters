// src/utils/id.ts

/**
 * Genera un local_id sin depender de crypto.getRandomValues (web/uuid issue)
 */
// src/utils/id.ts
export async function makeLocalId(prefix = "L"): Promise<string> {
  return `${prefix}${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export function nowISO() {
  return new Date().toISOString();
}
