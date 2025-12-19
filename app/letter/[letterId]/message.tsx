// app/letter/[letterId]/message.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { initDb } from "../../../src/db";
import { getMessage, upsertMessage } from "../../../src/repos/messages_repo";
import { normalizeParam } from "../../../src/utils/route";

export default function MessageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ letterId?: string | string[] }>();
  const letterId = normalizeParam(params.letterId);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!letterId) return;
        await initDb();
        const row = await getMessage(letterId);
        setText(row?.text ?? "");
      } catch (e: any) {
        console.error("load message error", e);
        Alert.alert("Error", e?.message ?? String(e));
      }
    })();
  }, [letterId]);

  const onSave = async () => {
    try {
      if (!letterId) return;
      setSaving(true);
      await upsertMessage(letterId, text);
      Alert.alert("Listo", "Mensaje guardado");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escribir un mensaje</Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Escribe tu mensaje aquí…"
        style={styles.input}
        multiline
      />

      <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
        <Text style={styles.btnText}>{saving ? "Guardando…" : "Guardar"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: "900" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
  },
  btn: { backgroundColor: "#1f7ae0", padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "900" },
});
