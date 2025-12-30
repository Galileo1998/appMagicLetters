import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import { getDrawing, saveDrawingPath } from "../../src/repos/drawings_repo"; // Importar getDrawing

// ... (El resto de tus configuraciones COLORS y BRUSH_SIZES siguen igual) ...
const COLORS = [
  "#111111", "#e53935", "#1e88e5", "#43a047", "#fdd835", 
  "#fb8c00", "#8e24aa", "#d81b60", "#795548", "#757575",
];
const BRUSH_SIZES = [3, 6, 12, 20];
type Stroke = { d: string; color: string; width: number };
function makePath(points: { x: number; y: number }[]) {
  if (points.length < 1) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
}

export default function DrawScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const viewShotRef = useRef<ViewShot>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<{ pts: { x: number; y: number }[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingImage, setExistingImage] = useState<string | null>(null); // 👈 IMAGEN DE FONDO

  const [color, setColor] = useState("#111111");
  const [width, setWidth] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // 👇 CARGAR DIBUJO EXISTENTE
  useEffect(() => {
    async function load() {
        if(!letterId) return;
        const prevDrawing = await getDrawing(letterId);
        if(prevDrawing) {
            setExistingImage(prevDrawing); // Guardamos la ruta para mostrarla de fondo
        }
    }
    load();
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
          const strokeColor = isEraser ? "#ffffff" : color;
          setStrokes(s => [...s, { d, color: strokeColor, width }]);
          return null;
        });
      },
    });
  }, [color, width, isEraser]);

  async function onSave() {
    if (!letterId || saving) return;
    try {
      setSaving(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await saveDrawingPath(letterId, uri);
        Alert.alert("Listo", "Dibujo actualizado.");
        router.back();
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  function onUndo() {
    setStrokes(prev => prev.slice(0, -1));
  }

  function onClear() {
    Alert.alert("Limpiar", "¿Borrar todo (incluyendo el dibujo anterior)?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar Todo", style: "destructive", onPress: () => {
        setStrokes([]);
        setCurrent(null);
        setExistingImage(null); // 👈 También quitamos el fondo si limpia
      }}
    ]);
  }

  const handleColorSelect = (c: string) => { setIsEraser(false); setColor(c); };
  const currentPath = current?.pts ? makePath(current.pts) : "";
  const activeDrawColor = isEraser ? "#ffffff" : color;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={{padding:5}}><Ionicons name="arrow-back" size={24} color="#333" /></Pressable>
        <Text style={styles.title}>Lienzo</Text>
        <Pressable style={styles.saveBtn} onPress={onSave}>
          {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveTxt}>Guardar</Text>}
        </Pressable>
      </View>

      <View style={styles.canvasContainer}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.8 }} style={{ flex: 1 }}>
            <View style={styles.canvas} {...pan.panHandlers}>
            
            {/* 👇 1. IMAGEN DE FONDO (SI EXISTE) */}
            {existingImage && (
                <Image 
                    source={{ uri: existingImage }} 
                    style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', resizeMode: 'contain' }]} 
                />
            )}

            {/* 👇 2. LIENZO SVG (PARA DIBUJAR ENCIMA) */}
            <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
                {/* Quitamos el Rect blanco para que se vea el fondo. Si no hay fondo, el container es blanco. */}
                {!existingImage && <Rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />}
                
                {strokes.map((s, idx) => (
                <Path key={idx} d={s.d} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath ? (
                <Path d={currentPath} stroke={activeDrawColor} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
            </Svg>

            </View>
        </ViewShot>
      </View>

      {/* TOOLS (Igual que antes) */}
      <View style={styles.toolsContainer}>
         <View style={styles.toolRow}>
             {/* Borrador y Clear */}
             <Pressable style={[styles.actionBtn, isEraser && styles.actionBtnActive]} onPress={() => setIsEraser(true)}>
                <Ionicons name="brush-outline" size={20} color={isEraser?"white":"#444"} /><Text style={{fontSize:10}}>Borrador</Text>
             </Pressable>
             <Pressable style={styles.actionBtn} onPress={onUndo}><Ionicons name="arrow-undo" size={20} color="#444" /></Pressable>
             <Pressable style={styles.actionBtn} onPress={onClear}><Ionicons name="trash-outline" size={20} color="red" /></Pressable>
         </View>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
            {COLORS.map(c => (
                <Pressable key={c} style={[styles.colorBtn, {backgroundColor:c}, (color===c && !isEraser) && styles.colorBtnSelected]} onPress={()=>handleColorSelect(c)} />
            ))}
         </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  top: { flexDirection: "row", justifyContent: "space-between", padding: 15, paddingTop: 50, backgroundColor: "white", elevation: 3 },
  title: { fontSize: 18, fontWeight: "900" },
  saveBtn: { backgroundColor: "#1e62d0", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  saveTxt: { color: "white", fontWeight: "bold" },
  canvasContainer: { flex: 1, padding: 10 },
  canvas: { flex: 1, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' }, // overflow hidden para el viewshot
  toolsContainer: { backgroundColor: "white", paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  toolRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  actionBtn: { alignItems: 'center', padding: 10 },
  actionBtnActive: { backgroundColor: '#555', borderRadius: 5 },
  colorScroll: { paddingHorizontal: 15 },
  colorBtn: { width: 36, height: 36, borderRadius: 18, marginRight: 12, borderWidth: 2, borderColor: 'white', elevation: 2 },
  colorBtnSelected: { borderColor: '#333', transform: [{ scale: 1.1 }] }
});