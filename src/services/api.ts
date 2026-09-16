import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export async function readJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error(
      response.ok
        ? "El servidor respondió de forma inesperada. Intenta nuevamente cuando tengas señal."
        : `El servidor no está disponible (${response.status}). Tus cambios siguen guardados en la aplicación.`
    );
  }
}

export async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = 120_000) {
  const token = await AsyncStorage.getItem("api_token");
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const canRetry = typeof init.body === "string" || init.body == null;
  const attempts = canRetry ? 3 : 1;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${API_BASE_URL}/${path}`, {
        ...init,
        headers,
        signal: init.signal ?? controller.signal,
      });
      if (attempt + 1 < attempts && (response.status === 429 || response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
        continue;
      }
      return response;
    } catch (error: any) {
      lastError = error;
      if (attempt + 1 >= attempts) {
        if (controller.signal.aborted) throw new Error("La conexión tardó demasiado. Intenta sincronizar nuevamente.");
        throw new Error("No hay conexión con el servidor. Tus cambios siguen guardados en el dispositivo.");
      }
      await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function loginRemote(phone: string, pin: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, pin }),
    signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) throw new Error("La conexión tardó demasiado. Revisa la señal e intenta de nuevo.");
    throw new Error("No hay conexión con el servidor. El primer acceso requiere internet.");
  } finally {
    clearTimeout(timer);
  }
  const data = await readJsonResponse(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || "No se pudo iniciar sesión");
  }
  await AsyncStorage.multiSet([
    ["api_token", data.token],
    ["user_phone", data.user.phone],
    ["user_id", String(data.user.id)],
  ]);
  return data.user as { id: string; name: string; phone: string; role: "TECH" };
}
