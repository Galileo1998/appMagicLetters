import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { getPhoto, upsertPhoto } from "../../../src/repos/photos_repo";

async function ensurePhotosDir(): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error("documentDirectory no disponible");
  const dir = base + "scip_cartas/photos/";
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

export default function PhotoScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const id = useMemo(() => String(letterId ?? ""), [letterId]);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [loading, setLoading] = useState(true);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const uri = await getPhoto(id);
        setSavedUri(uri);
      } catch (e) {
        console.error("load photo error", e);
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

      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.85,
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
    if (!tempUri) {
      Alert.alert("Foto", "Toma una foto primero.");
      return;
    }
    try {
      setSaving(true);
      await upsertPhoto(id, tempUri);
      setSavedUri(tempUri);
      setTempUri(null);
      Alert.alert("Listo", "Foto guardada.");
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "No se pudo guardar la foto en SQLite.");
    } finally {
      setSaving(false);
    }
  }

  function onRetake() {
    setTempUri(null);
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
        <Text style={styles.sub}>Necesitamos permiso para tomar la foto.</Text>
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

  const previewUri = tempUri ?? savedUri;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Foto de la carta</Text>
        <Text style={styles.sub}>Letter ID: {id}</Text>
      </View>

      {previewUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
          <View style={styles.row}>
            {tempUri ? (
              <>
                <Pressable style={styles.secondaryBtn} onPress={onRetake} disabled={saving}>
                  <Text style={styles.secondaryText}>Retomar</Text>
                </Pressable>

                <Pressable style={[styles.primaryBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
                  <Text style={styles.primaryText}>{saving ? "Guardando..." : "Guardar"}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryText}>Volver</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <View style={styles.empty}>
            <Text style={{ opacity: 0.6 }}>Aún no hay foto guardada</Text>
          </View>

          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryText}>Atrás</Text>
            </Pressable>

            <Pressable style={styles.primaryBtn} onPress={onTakePhoto}>
              <Text style={styles.primaryText}>Tomar foto</Text>
            </Pressable>
          </View>

          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  sub: { marginTop: 4, fontSize: 12, color: "#666" },

  cameraWrap: { flex: 1 },
  empty: { padding: 14, alignItems: "center" },

  previewWrap: { flex: 1, padding: 12 },
  preview: { flex: 1, width: "100%", backgroundColor: "#f4f4f4", borderRadius: 12 },

  row: { flexDirection: "row", gap: 12, padding: 12, justifyContent: "center" },

  primaryBtn: { backgroundColor: "#1e88e5", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: 140, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },

  secondaryBtn: { backgroundColor: "#eaeaea", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: 140, alignItems: "center" },
  secondaryText: { color: "#111", fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  err: { color: "#b00020", fontWeight: "700" },
});
