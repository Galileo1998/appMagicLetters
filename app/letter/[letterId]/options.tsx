import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getLetter } from "../../../src/repos/letters_repo";

export default function OptionsScreen() {
  const router = useRouter();
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const [childCode, setChildCode] = useState("");

  useEffect(() => {
    (async () => {
      if (!letterId) return;
      const l = await getLetter(String(letterId));
      setChildCode(l?.child_code ?? "");
    })();
  }, [letterId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Opciones</Text>
      <Text style={styles.sub}>Carta: {String(letterId)}</Text>
      <Text style={styles.sub}>Niño/a: {childCode}</Text>

      <View style={styles.grid}>
        <Pressable
          style={[styles.tile, { backgroundColor: "#f6c400" }]}
          onPress={() => router.push(`/letter/${letterId}/photo`)}
        >
          <Text style={styles.tileText}>📸 Foto</Text>
        </Pressable>

        <Pressable
          style={[styles.tile, { backgroundColor: "#2b7de9" }]}
          onPress={() => router.push(`/draw/${letterId}`)}
        >
          <Text style={styles.tileText}>🎨 Dibujo</Text>
        </Pressable>

        <Pressable
          style={[styles.tile, { backgroundColor: "#c46b2e" }]}
          onPress={() => router.push(`/letter/${letterId}/message`)}
        >
          <Text style={styles.tileText}>✍️ Mensaje</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "900" },
  sub: { color: "#444" },
  grid: { marginTop: 14, gap: 12 },
  tile: { padding: 16, borderRadius: 14, alignItems: "center" },
  tileText: { fontSize: 18, fontWeight: "900", color: "#111" },
});
