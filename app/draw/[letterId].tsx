// app/draw/[letterId].tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { initDb } from "../../src/db";
import { getDrawing, upsertDrawing, type Stroke } from "../../src/repos/drawings_repo";
import { normalizeParam } from "../../src/utils/route";

function makePath(points: { x: number; y: number }[]) {
  if (points.length < 1) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
}

export default function DrawScreen() {
  const params = useLocalSearchParams<{ letterId?: string | string[] }>();
  const letterId = normalizeParam(params.letterId);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<{ pts: { x: number; y: number }[] } | null>(null);

  const [color, setColor] = useState("#111111");
  const [width, setWidth] = useState(6);

  const svgRef = useRef<View>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!letterId) return;
        await initDb();
        const existing = await getDrawing(letterId);
        if (existing) setStrokes(existing);
      } catch (e: any) {
        console.error("load drawing error", e);
        Alert.alert("Error", e?.message ?? String(e));
      }
    })();
  }, [letterId]);

  const pan = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        setCurrent({ pts: [{ x, y }] });
      },
      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        setCurrent(prev => {
          if (!prev) return { pts: [{ x, y }] };
          return { pts: [...prev.pts, { x, y }] };
        });
      },
      onPanResponderRelease: () => {
        setCurrent(prev => {
          if (!prev || prev.pts.length < 2) return null;
          const d = makePath(prev.pts);
          setStrokes(s => [...s, { d, color, width }]);
          return null;
        });
      },
    });
  }, [color, width]);

  async function onSave() {
    try {
      if (!letterId) return;
      await upsertDrawing(letterId, strokes);
      Alert.alert("Listo", "Dibujo guardado");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? String(e));
    }
  }

  function onClear() {
    setStrokes([]);
    setCurrent(null);
  }

  const currentPath = current?.pts ? makePath(current.pts) : "";

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Dibujo de la carta</Text>
        <Pressable style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveTxt}>Guardar</Text>
        </Pressable>
      </View>

      <View style={styles.tools}>
        <Pressable style={[styles.toolBtn, { borderColor: color === "#111111" ? "#111" : "#ddd" }]} onPress={() => setColor("#111111")}>
          <Text>✏️</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, { borderColor: color === "#e53935" ? "#111" : "#ddd" }]} onPress={() => setColor("#e53935")}>
          <Text>🟥</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, { borderColor: color === "#43a047" ? "#111" : "#ddd" }]} onPress={() => setColor("#43a047")}>
          <Text>🟩</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, { borderColor: color === "#1e88e5" ? "#111" : "#ddd" }]} onPress={() => setColor("#1e88e5")}>
          <Text>🟦</Text>
        </Pressable>

        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={{ fontWeight: "900" }}>🗑️</Text>
        </Pressable>
      </View>

      <View style={styles.canvas} ref={svgRef} {...pan.panHandlers}>
        <Svg width="100%" height="100%">
          <Rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
          {strokes.map((s, idx) => (
            <Path key={idx} d={s.d} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPath ? (
            <Path d={currentPath} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </Svg>
      </View>

      <Text style={styles.footer}>Color: {color} · Grosor: {width}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "900" },
  saveBtn: { backgroundColor: "#1f7ae0", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  saveTxt: { color: "#fff", fontWeight: "900" },

  tools: { flexDirection: "row", gap: 10, padding: 10, alignItems: "center" },
  toolBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  clearBtn: { marginLeft: "auto", width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },

  canvas: { flex: 1, margin: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 14, overflow: "hidden" },
  footer: { padding: 10, textAlign: "center", opacity: 0.7 },
});
