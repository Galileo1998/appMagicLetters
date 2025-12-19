// app/letter/[letterId]/photo.tsx
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { initDb } from "../../../src/db";
import { addPhoto, deletePhoto, listPhotos, type PhotoRow } from "../../../src/repos/photos_repo";

async function ensurePhotosDir(): Promise<string> {
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!base) throw new Error("documentDirectory/cacheDirectory no disponible");

  const dir = base + "scip_cartas/photos/";
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch (e: any) {
    // si existe, ok
  }
  return dir;
}

export default function PhotoScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const id = useMemo(() => String(letterId ?? ""), [letterId]);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function reload() {
    await initDb();
    const rows = await listPhotos(id);
    setPhotos(rows);
    setPreviewUri(rows[0]?.photo_uri ?? null);
  }

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        await reload();
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "No se pudo cargar fotos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onTakePhoto() {
    try {
      if (!cameraRef.current) {
        Alert.alert("Cámara", "La cámara no está lista todavía.");
        return;
      }
      if (photos.length >= 3) {
        Alert.alert("Límite", "Ya tienes 3 fotos guardadas.");
        return;
      }

      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });

      if (!pic?.uri) throw new Error("No se obtuvo uri de la foto");

      const dir = await ensurePhotosDir();
      const target = dir + `${id}_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: pic.uri, to: target });

      setTempUri(target);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "No se pudo tomar la foto.");
    }
  }

  async function onSave() {
    if (!tempUri) return;
    try {
      setSaving(true);
      await addPhoto(id, tempUri);
      setTempUri(null);
      await reload();
      Alert.alert("Listo", "Foto guardada.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "No se pudo guardar la foto.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(slot: 1 | 2 | 3) {
    try {
      await deletePhoto(id, slot);
      await reload();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo eliminar.");
    }
  }

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Falta letterId en la ruta.</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Cargando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Permiso de cámara</Text>
        <Text style={styles.sub}>Necesitamos permiso para tomar fotos.</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryText}>Dar permiso</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Cargando...</Text>
      </View>
    );
  }

  const showingCamera = !previewUri && !tempUri;

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Fotos de la carta</Text>
          <Text style={styles.topSub}>ID: {id} • {photos.length}/3</Text>
        </View>
      </View>

      {/* CAMERA FULLSCREEN */}
      {showingCamera ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.cameraControls}>
            <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryText}>Atrás</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onTakePhoto}>
              <Text style={styles.primaryText}>Tomar foto</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.previewWrap}>
          {/* PREVIEW (temp o seleccionada) */}
          <Image
            source={{ uri: tempUri ?? previewUri ?? undefined }}
            style={styles.preview}
            resizeMode="contain"
          />

          {/* THUMBNAILS */}
          <View style={styles.thumbsRow}>
            {photos.map(p => (
              <Pressable key={p.id} onPress={() => setPreviewUri(p.photo_uri)} style={styles.thumbWrap}>
                <Image source={{ uri: p.photo_uri }} style={styles.thumb} />
                <Pressable onPress={() => onDelete(p.slot)} style={styles.delBadge}>
                  <Text style={styles.delTxt}>✕</Text>
                </Pressable>
                <Text style={styles.slotTxt}>{p.slot}</Text>
              </Pressable>
            ))}
          </View>

          {/* ACTIONS */}
          <View style={styles.row}>
            {tempUri ? (
              <>
                <Pressable style={styles.secondaryBtn} onPress={() => setTempUri(null)} disabled={saving}>
                  <Text style={styles.secondaryText}>Retomar</Text>
                </Pressable>
                <Pressable style={[styles.primaryBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
                  <Text style={styles.primaryText}>{saving ? "Guardando..." : "Guardar"}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.primaryBtn, photos.length >= 3 && { opacity: 0.5 }]}
                  onPress={() => {
                    if (photos.length >= 3) return;
                    setPreviewUri(null); // vuelve a cámara fullscreen
                  }}
                  disabled={photos.length >= 3}
                >
                  <Text style={styles.primaryText}>Tomar otra</Text>
                </Pressable>

                <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
                  <Text style={styles.secondaryText}>Volver</Text>
                </Pressable>
              </>
            )}
          </View>

          {!previewUri && photos.length === 0 && !tempUri ? (
            <Text style={{ textAlign: "center", marginTop: 10, color: "#666" }}>
              Aún no hay foto guardada
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  backTxt: { fontSize: 20, fontWeight: "900" },
  topTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  topSub: { marginTop: 2, fontSize: 12, color: "#666" },

  cameraWrap: { flex: 1 },
  camera: { flex: 1, backgroundColor: "#000" },
  cameraControls: {
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },

  previewWrap: { flex: 1, padding: 12 },
  preview: { flex: 1, width: "100%", backgroundColor: "#f4f4f4", borderRadius: 12 },

  thumbsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  thumbWrap: { width: 76, height: 76, borderRadius: 12, overflow: "hidden", position: "relative" },
  thumb: { width: "100%", height: "100%" },
  delBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  delTxt: { color: "white", fontWeight: "900", fontSize: 12 },
  slotTxt: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    fontWeight: "900",
    fontSize: 12,
  },

  row: { flexDirection: "row", gap: 12, paddingTop: 12, justifyContent: "center" },

  primaryBtn: { backgroundColor: "#1e88e5", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: 140, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondaryBtn: { backgroundColor: "#eaeaea", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: 140, alignItems: "center" },
  secondaryText: { color: "#111", fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 18, fontWeight: "900" },
  sub: { marginTop: 6, color: "#666", textAlign: "center" },
  err: { color: "#b00020", fontWeight: "900" },
});
