import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener esto instalado
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { initDb } from "../../src/db";
import { getDrawing, upsertDrawing, type Stroke } from "../../src/repos/drawings_repo";
import { normalizeParam } from "../../src/utils/route";

// --- CONFIGURACIÓN ---
const COLORS = [
  "#111111", // Negro
  "#e53935", // Rojo
  "#1e88e5", // Azul
  "#43a047", // Verde
  "#fdd835", // Amarillo
  "#fb8c00", // Naranja
  "#8e24aa", // Morado
  "#d81b60", // Rosa
  "#795548", // Café
  "#757575", // Gris
];

const BRUSH_SIZES = [3, 6, 12, 20];

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

  // Estados de herramientas
  const [color, setColor] = useState("#111111");
  const [width, setWidth] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [lastColor, setLastColor] = useState("#111111"); // Para recordar color al quitar borrador

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
          // Si es borrador, usamos color blanco
          const strokeColor = isEraser ? "#ffffff" : color;
          setStrokes(s => [...s, { d, color: strokeColor, width }]);
          return null;
        });
      },
    });
  }, [color, width, isEraser]); // Dependencias importantes para que el pan se actualice

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

  // Función Deshacer
  function onUndo() {
    setStrokes(prev => prev.slice(0, -1));
  }

  // Función Limpiar Todo
  function onClear() {
    Alert.alert("Limpiar", "¿Borrar todo el dibujo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => {
        setStrokes([]);
        setCurrent(null);
      }}
    ]);
  }

  const handleColorSelect = (c: string) => {
    setIsEraser(false);
    setColor(c);
    setLastColor(c);
  };

  const handleEraser = () => {
    setIsEraser(true);
    // No cambiamos 'color' visualmente para no perder la selección, 
    // pero la lógica del PanResponder usará blanco.
  };

  const currentPath = current?.pts ? makePath(current.pts) : "";
  const activeDrawColor = isEraser ? "#ffffff" : color;

  return (
    <View style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={{padding:5}}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>Lienzo</Text>
        <Pressable style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveTxt}>Guardar</Text>
        </Pressable>
      </View>

      {/* --- CANVAS --- */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvas} ref={svgRef} {...pan.panHandlers}>
          <Svg width="100%" height="100%">
            <Rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {strokes.map((s, idx) => (
              <Path 
                key={idx} 
                d={s.d} 
                stroke={s.color} 
                strokeWidth={s.width} 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            ))}
            {currentPath ? (
              <Path 
                d={currentPath} 
                stroke={activeDrawColor} 
                strokeWidth={width} 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            ) : null}
          </Svg>
        </View>
      </View>

      {/* --- BARRA DE HERRAMIENTAS --- */}
      <View style={styles.toolsContainer}>
        
        {/* FILA 1: Grosores y Acciones */}
        <View style={styles.toolRow}>
          
          {/* Selector de Grosor */}
          <View style={styles.sizeSelector}>
            {BRUSH_SIZES.map(s => (
              <Pressable 
                key={s} 
                style={[styles.sizeBtn, width === s && styles.sizeBtnActive]}
                onPress={() => setWidth(s)}
              >
                <View style={{
                  width: Math.min(s + 2, 16), 
                  height: Math.min(s + 2, 16), 
                  borderRadius: 10, 
                  backgroundColor: width === s ? '#1e62d0' : '#888' 
                }} />
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Borrador */}
          <Pressable 
            style={[styles.actionBtn, isEraser && styles.actionBtnActive]} 
            onPress={handleEraser}
          >
            <Ionicons name="brush-outline" size={20} color={isEraser ? "white" : "#444"} />
            <Text style={{fontSize:10, color: isEraser ? "white" : "#444"}}>Borrador</Text>
          </Pressable>

          {/* Deshacer */}
          <Pressable style={styles.actionBtn} onPress={onUndo}>
            <Ionicons name="arrow-undo" size={20} color="#444" />
          </Pressable>

          {/* Limpiar */}
          <Pressable style={styles.actionBtn} onPress={onClear}>
            <Ionicons name="trash-outline" size={20} color="#d32f2f" />
          </Pressable>

        </View>

        {/* FILA 2: Colores Scrollables */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
          {COLORS.map(c => (
            <Pressable
              key={c}
              style={[
                styles.colorBtn, 
                { backgroundColor: c },
                (color === c && !isEraser) && styles.colorBtnSelected
              ]}
              onPress={() => handleColorSelect(c)}
            />
          ))}
          <View style={{width: 20}} /> 
        </ScrollView>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  
  top: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    padding: 15, paddingTop: 50, backgroundColor: "white", elevation: 3 
  },
  title: { fontSize: 18, fontWeight: "900", color: "#333" },
  saveBtn: { backgroundColor: "#1e62d0", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  saveTxt: { color: "#fff", fontWeight: "bold" },

  canvasContainer: { flex: 1, padding: 10 },
  canvas: { 
    flex: 1, 
    backgroundColor: 'white', 
    borderRadius: 16, 
    elevation: 2, 
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5,
    overflow: "hidden" // Importante para que no se salga el trazo
  },

  toolsContainer: { 
    backgroundColor: "white", 
    paddingBottom: 20, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    elevation: 10,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width:0, height:-2}
  },

  toolRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },

  // Selector de tamaños
  sizeSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: 20, padding: 4 },
  sizeBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 17 },
  sizeBtnActive: { backgroundColor: '#dbeafe' },

  divider: { width: 1, height: 25, backgroundColor: '#ddd', marginHorizontal: 5 },

  // Botones de acción (Borrador, Deshacer)
  actionBtn: { alignItems: 'center', padding: 8, borderRadius: 8 },
  actionBtnActive: { backgroundColor: '#555' },

  // Scroll de colores
  colorScroll: { paddingHorizontal: 15, paddingTop: 12 },
  colorBtn: { 
    width: 36, height: 36, borderRadius: 18, marginRight: 12, 
    borderWidth: 2, borderColor: 'white', elevation: 2 
  },
  colorBtnSelected: { 
    borderColor: '#333', transform: [{ scale: 1.1 }]
  }
});