// app/draw/[letterId].tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { clearDrawing, getDrawing, upsertDrawing } from "../../src/repos/drawings_repo";

type Stroke = { d: string; color: string; width: number };

const CANVAS_W = 1000;
const CANVAS_H = 700;

const COLORS = ["#111111", "#ff0000", "#00aa00", "#0066ff", "#ffcc00", "#7b2cff", "#00c2c2"];
const WIDTHS = [3, 6, 12];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Parse simple de nuestro propio SVG (generado abajo)
function parseSvgToStrokes(svgXml: string): Stroke[] {
  const strokes: Stroke[] = [];
  const pathRegex = /<path[^>]*d="([^"]+)"[^>]*stroke="([^"]+)"[^>]*stroke-width="([^"]+)"[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = pathRegex.exec(svgXml)) !== null) {
    strokes.push({ d: m[1], color: m[2], width: Number(m[3]) || 3 });
  }
  return strokes;
}

function buildSvgXml(strokes: Stroke[]) {
  const paths = strokes
    .map(
      s =>
        `<path d="${s.d}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
  <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="white" />
  ${paths}
</svg>`;
}

export default function DrawScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const id = String(letterId);

  const [tool, setTool] = useState<"PEN" | "ERASER">("PEN");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentD, setCurrentD] = useState<string>("");

  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [layout, setLayout] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);

  const activeColor = tool === "ERASER" ? "#ffffff" : color;
  const activeWidth = tool === "ERASER" ? Math.max(16, width * 2) : width;

  const safeStrokes = useMemo(() => strokes.filter(Boolean), [strokes]);

  useEffect(() => {
    (async () => {
      try {
        const d = await getDrawing(id);
        if (d?.svg_xml) {
          setStrokes(parseSvgToStrokes(d.svg_xml));
        }
      } catch (e) {
        console.error("load drawing error", e);
      }
    })();
  }, [id]);

  function toCanvasXY(locationX: number, locationY: number) {
    if (layout.w > 0 && layout.h > 0) {
      const x = (locationX / layout.w) * CANVAS_W;
      const y = (locationY / layout.h) * CANVAS_H;
      return { x: clamp(x, 0, CANVAS_W), y: clamp(y, 0, CANVAS_H) };
    }
    return { x: clamp(locationX, 0, CANVAS_W), y: clamp(locationY, 0, CANVAS_H) };
  }

  function onStart(x: number, y: number) {
    lastPoint.current = { x, y };
    setCurrentD(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  function onMove(x: number, y: number) {
    if (!lastPoint.current) return;
    setCurrentD(prev =>
      prev
        ? `${prev} L ${x.toFixed(1)} ${y.toFixed(1)}`
        : `M ${x.toFixed(1)} ${y.toFixed(1)}`
    );
    lastPoint.current = { x, y };
  }

  function onEnd() {
    if (currentD && currentD.length > 3) {
      setStrokes(prev => [...prev, { d: currentD, color: activeColor, width: activeWidth }]);
    }
    setCurrentD("");
    lastPoint.current = null;
  }

  function onClear() {
    setStrokes([]);
    setCurrentD("");
    lastPoint.current = null;
  }

  async function onSave() {
    try {
      setSaving(true);
      const svgXml = buildSvgXml(safeStrokes);
      await upsertDrawing(id, svgXml);
      Alert.alert("Listo", "Dibujo guardado.");
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    try {
      await clearDrawing(id);
      onClear();
      Alert.alert("Listo", "Dibujo eliminado.");
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Dibujo de la carta</Text>

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? "Guardando..." : "Guardar"}</Text>
        </Pressable>
      </View>

      <View style={styles.toolsRow}>
        <Pressable style={[styles.toolBtn, tool === "PEN" && styles.toolActive]} onPress={() => setTool("PEN")}>
          <Text>✏</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, tool === "ERASER" && styles.toolActive]} onPress={() => setTool("ERASER")}>
          <Text>🧽</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={onClear}>
          <Text>🧹</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={onDelete}>
          <Text>🗑</Text>
        </Pressable>
      </View>

      <View style={styles.colorsRow}>
        {COLORS.map(c => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color === c && styles.colorSelected,
            ]}
          />
        ))}
      </View>

      <View style={styles.widthRow}>
        {WIDTHS.map(w => (
          <Pressable
            key={w}
            onPress={() => setWidth(w)}
            style={[styles.widthDot, width === w && styles.widthSelected]}
          >
            <View style={{ width: w * 2, height: w * 2, borderRadius: 999, backgroundColor: "#111" }} />
          </Pressable>
        ))}
      </View>

      <View
        style={styles.canvasWrap}
        onLayout={e => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={evt => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = toCanvasXY(locationX, locationY);
          onStart(p.x, p.y);
        }}
        onResponderMove={evt => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = toCanvasXY(locationX, locationY);
          onMove(p.x, p.y);
        }}
        onResponderRelease={onEnd}
        onResponderTerminate={onEnd}
      >
        <Svg style={styles.svg} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
          <Rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="white" />

          {safeStrokes.map((s, idx) => (
            <Path
              key={`${idx}-${s.d.length}`}
              d={s.d}
              stroke={s.color}
              strokeWidth={s.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {currentD ? (
            <Path
              d={currentD}
              stroke={activeColor}
              strokeWidth={activeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>

      <Text style={styles.hint}>
        Herramienta: {tool === "PEN" ? "Lápiz" : "Borrador"} · Color:{" "}
        {tool === "ERASER" ? "Blanco" : color} · Grosor: {activeWidth}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 10 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800" },
  saveBtn: { backgroundColor: "#1e62d0", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: "white", fontWeight: "800" },

  toolsRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  toolBtn: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, backgroundColor: "#fff" },
  toolActive: { borderColor: "#1e62d0" },

  colorsRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  colorDot: { width: 22, height: 22, borderRadius: 999, borderWidth: 1, borderColor: "#ddd" },
  colorSelected: { borderColor: "#111", borderWidth: 2 },

  widthRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  widthDot: { borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 999, backgroundColor: "#fff" },
  widthSelected: { borderColor: "#111" },

  canvasWrap: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, overflow: "hidden" },
  svg: { flex: 1 },

  hint: { color: "#333" },
});
