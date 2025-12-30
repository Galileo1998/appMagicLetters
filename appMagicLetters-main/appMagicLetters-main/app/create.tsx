import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { initDb } from "../src/db";
import { createLetter } from "../src/repos/letters_repo";

export default function CreateScreen() {
  const router = useRouter();
  const [childCode, setChildCode] = useState("");

  const onCreate = async () => {
    try {
      const code = childCode.trim();
      if (!code) {
        Alert.alert("Error", "Ingresa el código del niño/a");
        return;
      }

      await initDb();
      const localId = await createLetter(code);

      router.replace(`/letter/${localId}/options`);
    } catch (e: any) {
      Alert.alert("Error", `No se pudo crear la carta.\n${e?.message ?? e}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear carta</Text>

      <Text style={styles.label}>Código del niño/a</Text>
      <TextInput
        value={childCode}
        onChangeText={setChildCode}
        placeholder="Ej: 6TY77UU8"
        style={styles.input}
        autoCapitalize="characters"
      />

      <Pressable style={styles.btn} onPress={onCreate}>
        <Text style={styles.btnText}>Continuar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  label: { fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12 },
  btn: { backgroundColor: "#1f7ae0", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 8 },
  btnText: { color: "white", fontWeight: "800" },
});
