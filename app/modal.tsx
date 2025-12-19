// app/index.tsx
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { initDb } from "../src/db"; // ✅ named import
import { LetterRow, listLetters } from "../src/repos/letters_repo";

export default function Home() {
  const router = useRouter();
  const [letters, setLetters] = useState<LetterRow[]>([]);

  const load = useCallback(async () => {
    await initDb();            // ✅ asegura schema+migraciones 1 vez
    const rows = await listLetters();
    setLetters(rows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.btnPrimary} onPress={() => router.push("/create")}>
        <Text style={styles.btnText}>Crear nueva carta</Text>
      </Pressable>

      <Text style={styles.section}>Cartas locales ({letters.length})</Text>

      <ScrollView>
        {letters.map(l => (
          <Pressable
            key={l.local_id}
            style={styles.card}
            onPress={() => router.push(`/letter/${l.local_id}/options`)}
          >
            <Text style={styles.cardTitle}>{l.child_code}</Text>
            <Text style={styles.cardSub}>Estado: {l.status}</Text>
            <Text numberOfLines={2} style={styles.cardSub}>
              {l.text_feelings ?? ""}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  btnPrimary: { backgroundColor: "#2b7", padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
  section: { marginTop: 14, marginBottom: 8, fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: "#f2f2f2", padding: 12, borderRadius: 12, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSub: { marginTop: 4, color: "#444" },
});
