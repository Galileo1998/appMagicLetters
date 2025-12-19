// src/utils/id.ts

/**
 * Genera un local_id sin depender de crypto.getRandomValues (web/uuid issue)
 */
export function makeLocalId(prefix = "L") {
  // randomUUID disponible en expo-crypto (estable en mobile)

  // cortito estilo “6TY77UU8” pero sin colisiones: tomamos 8 chars
  return `${prefix}${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export function nowISO() {
  return new Date().toISOString();
}
