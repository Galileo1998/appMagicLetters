// app/index.tsx
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { initDb } from "../src/db";
import { LetterRow, listLetters } from "../src/repos/letters_repo";

function statusChip(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "SYNCED") return { bg: "#d1fae5", fg: "#065f46", label: "SYNCED" };
  if (s === "PENDING_SYNC") return { bg: "#ffedd5", fg: "#9a3412", label: "PENDING" };
  return { bg: "#fee2e2", fg: "#991b1b", label: "DRAFT" };
}

/**
 * Preview inteligente:
 * - Si hay texto → muestra texto
 * - Si no hay texto → muestra qué componentes tiene
 */
function preview(l: LetterRow) {
  const txt =
    (l.text_feelings ?? "").trim() ||
    (l.text_activities ?? "").trim() ||
    (l.text_learning ?? "").trim() ||
    (l.text_share ?? "").trim() ||
    (l.text_thanks ?? "").trim();

  if (txt.length) return txt;

  const parts: string[] = [];
  if ((l.has_message ?? 0) > 0) parts.push("Mensaje");
  if ((l.photos_count ?? 0) > 0) parts.push("Fotografías");
  if ((l.has_drawing ?? 0) > 0) parts.push("Dibujo");

  if (!parts.length) return "Aún no tiene contenido";

  return `Contiene: ${parts.join(" · ")}`;
}

/**
 * Íconos de contenido del borrador
 */
function DraftIcons({ item }: { item: LetterRow }) {
  const hasMessage = (item.has_message ?? 0) > 0;
  const hasPhotos = (item.photos_count ?? 0) > 0;
  const hasDrawing = (item.has_drawing ?? 0) > 0;

  if (!hasMessage && !hasPhotos && !hasDrawing) return null;

  return (
    <View style={styles.iconsRow}>
      {hasMessage && <Text style={styles.icon}>📝</Text>}
      {hasPhotos && (
        <Text style={styles.icon}>
          📷{item.photos_count && item.photos_count > 1 ? ` ${item.photos_count}` : ""}
        </Text>
      )}
      {hasDrawing && <Text style={styles.icon}>🎨</Text>}
    </View>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function Home() {
  const router = useRouter();
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    await initDb();
    const rows = await listLetters();
    setLetters(rows);
    setReady(true);
  }, []);

  // 🔄 refresca cada vez que la pantalla vuelve a foco
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const countText = useMemo(
    () => `Cartas locales (${letters.length})`,
    [letters.length]
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.btnPrimary} onPress={() => router.push("/create")}>
        <Text style={styles.btnText}>Crear nueva carta</Text>
      </Pressable>

      <Text style={styles.section}>{countText}</Text>

      <FlatList
        data={letters}
        keyExtractor={(l) => l.local_id}
        contentContainerStyle={{ paddingBottom: 18 }}
        refreshing={!ready}
        onRefresh={load}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aún no hay cartas</Text>
            <Text style={styles.emptySub}>
              Toca “Crear nueva carta” para empezar.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const chip = statusChip(item.status);
          const date = fmtDate(item.updated_at ?? item.created_at);

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/letter/${item.local_id}/options`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.child_code}</Text>

                <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                  <Text style={[styles.chipText, { color: chip.fg }]}>
                    {chip.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardMeta}>
                {date ? `Actualizado: ${date}` : ""}
              </Text>

              <Text numberOfLines={3} style={styles.cardPreview}>
                {preview(item)}
              </Text>

              {/* 👇 Íconos de contenido */}
              <DraftIcons item={item} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },

  btnPrimary: {
    backgroundColor: "#2b7",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800", fontSize: 15 },

  section: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "900" },

  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.4 },

  cardMeta: { marginTop: 6, fontSize: 12, color: "#666" },
  cardPreview: { marginTop: 10, fontSize: 14, color: "#333", lineHeight: 19 },

  iconsRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },

  empty: {
    marginTop: 40,
    padding: 18,
    backgroundColor: "#f6f6f6",
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900" },
  emptySub: { marginTop: 6, color: "#555" },
});
