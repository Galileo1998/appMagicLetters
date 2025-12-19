// app/create.tsx
import { makeLocalId } from "@/src/utils/id";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { createLetter } from "../src/repos/letters_repo";

export default function CreateScreen() {
  const [childCode, setChildCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function onCreate() {
    const code = childCode.trim();
    if (!code) {
      Alert.alert("Falta código", "Escribe el código del niño.");
      return;
    }

    try {
      setSaving(true);
      const localId = await makeLocalId("L");
      await createLetter(localId, code);

      router.replace(`/letter/${localId}/options`);
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Crear carta</Text>

      <Text style={styles.label}>Código del niño</Text>
      <TextInput
        value={childCode}
        onChangeText={setChildCode}
        placeholder="Ej: 6TY77UU8"
        style={styles.input}
        autoCapitalize="characters"
      />

      <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={onCreate} disabled={saving}>
        <Text style={styles.btnText}>{saving ? "Creando..." : "Continuar"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 18, fontWeight: "700" },
  label: { fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 10 },
  btn: { backgroundColor: "#1e62d0", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
});
