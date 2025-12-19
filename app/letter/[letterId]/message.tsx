// app/letter/[letterId]/message.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getMessage, upsertMessage } from "../../../src/repos/messages_repo";
export default function MessageScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const id = String(letterId);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const m = await getMessage(id);
        setText(m?.text ?? "");
      } catch (e: any) {
        console.error("load message error", e);
      }
    })();
  }, [id]);

  async function onSave() {
    try {
      setSaving(true);
      await upsertMessage(id, text);
      Alert.alert("Listo", "Mensaje guardado.");
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Escribir un mensaje</Text>
      <Text style={styles.sub}>Letter ID: {id}</Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Escribe aquí…"
        multiline
        style={styles.input}
      />

      <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
        <Text style={styles.btnText}>{saving ? "Guardando..." : "Guardar"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 18, fontWeight: "800" },
  sub: { color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    minHeight: 220,
    textAlignVertical: "top",
  },
  btn: { backgroundColor: "#1e62d0", padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "800" },
});
