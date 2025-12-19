// src/utils/route.ts
export function normalizeParam(p: string | string[] | undefined | null): string {
  const v = Array.isArray(p) ? p[0] : p;
  return typeof v === "string" ? v : "";
}
