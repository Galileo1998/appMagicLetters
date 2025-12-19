// app/(tabs)/index.tsx
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { initDb } from "../../src/db";
import { listLetters, type LetterRow } from "../../src/repos/letters_repo";

export default function HomeScreen() {
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      await initDb();
      const rows = await listLetters();
      setLetters(rows);
    } catch (e) {
      console.error("Home refresh failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SCIP Cartas</Text>

      <Pressable style={styles.btn} onPress={() => router.push("/create")}>
        <Text style={styles.btnText}>CREAR CARTA</Text>
      </Pressable>

      <Pressable style={[styles.btn, { marginTop: 10 }]} onPress={refresh}>
        <Text style={styles.btnText}>{loading ? "CARGANDO..." : "REFRESCAR"}</Text>
      </Pressable>

      <Text style={styles.section}>Cartas loales ({letters.length})</Text>

      <ScrollView>
        {letters.map(l => (
          <Pressable
            key={l.local_id}
            style={styles.card}
            onPress={() => router.push(`/letter/${l.local_id}/options`)}
          >
            <Text style={styles.cardTitle}>{l.child_code}</Text>
            <Text style={styles.cardSub}>Estado: {l.status}</Text>
            <Text numberOfLines={2}>{l.text_feelings ?? ""}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 10 },
  btn: { backgroundColor: "#1e88e5", padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "900" },
  section: { marginTop: 16, fontSize: 16, fontWeight: "800" },
  card: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 12, marginTop: 10 },
  cardTitle: { fontSize: 16, fontWeight: "900" },
  cardSub: { opacity: 0.7, marginBottom: 4 },
});
