import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = 120_000) {
  const token = await AsyncStorage.getItem("api_token");
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE_URL}/${path}`, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
  } catch (error: any) {
    if (controller.signal.aborted) {
      throw new Error("La conexión tardó demasiado. Se intentará nuevamente.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function loginRemote(phone: string, pin: string) {
  const response = await fetch(`${API_BASE_URL}/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, pin }),
  });
  const data = await response.json();
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
