import * as FileSystem from "expo-file-system";

export async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

export function drawingsDir() {
  return `${FileSystem.documentDirectory}drawings/`;
}

export async function savePngBase64(fileName: string, base64: string) {
  const dir = drawingsDir();
  await ensureDir(dir);
  const fullPath = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(fullPath, base64, { encoding: FileSystem.EncodingType.Base64 });
  return fullPath;
}
