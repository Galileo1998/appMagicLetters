import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import ViewShot from "react-native-view-shot";
import { getDrawing, saveDrawingPath } from "../../src/repos/drawings_repo";

// 🎨 EXTENDED COLOR PALETTE
const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', 
  '#800080', '#A52A2A', '#808080', '#FFFFFF'
];

// ✏️ STROKE WIDTHS
const STROKES = [2, 5, 8, 12, 20];

// SHAPE TYPES
type ShapeType = 'pen' | 'line' | 'circle' | 'rect' | 'eraser';

interface DrawingItem {
  type: ShapeType;
  points?: { x: number, y: number }[]; // For pen/eraser
  start?: { x: number, y: number };    // For shapes
  end?: { x: number, y: number };      // For shapes
  color: string;
  width: number;
}

export default function DrawScreen() {
  const router = useRouter();
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const viewShotRef = useRef<ViewShot>(null);

  // STATES
  const [paths, setPaths] = useState<DrawingItem[]>([]); // History of all shapes/strokes
  const [currentPath, setCurrentPath] = useState<any[]>([]); // Current drag points
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null); // Start point for shapes
  
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tool, setTool] = useState<ShapeType>('pen');
  
  const [saving, setSaving] = useState(false);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  // LOAD BACKGROUND IMAGE
  useEffect(() => {
    async function load() {
      if(!letterId) return;
      const prevDrawing = await getDrawing(letterId);
      if(prevDrawing) {
        setExistingImage(prevDrawing);
      }
    }
    load();
  }, [letterId]);

  // 🖱️ GESTURE HANDLER
  const panResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        if (tool === 'pen' || tool === 'eraser') {
          // Start freehand
          setCurrentPath([{ x: locationX, y: locationY }]);
        } else {
          // Start shape
          setStartPoint({ x: locationX, y: locationY });
          setCurrentPath([{ x: locationX, y: locationY }]); // Temp end point
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        if (tool === 'pen' || tool === 'eraser') {
          setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
        } else {
          // Update shape preview
          setCurrentPath([{ x: locationX, y: locationY }]);
        }
      },
      onPanResponderRelease: () => {
        if (tool === 'pen' || tool === 'eraser') {
          if (currentPath.length > 0) {
            setPaths((prev) => [...prev, { 
              type: tool, 
              points: currentPath, 
              color: tool === 'eraser' ? '#FFFFFF' : color, 
              width: strokeWidth 
            }]);
          }
        } else if (startPoint) {
          // Finalize shape
          const endPoint = currentPath[0];
          setPaths((prev) => [...prev, {
            type: tool,
            start: startPoint,
            end: endPoint,
            color: color,
            width: strokeWidth
          }]);
        }
        
        // Cleanup temp states
        setCurrentPath([]);
        setStartPoint(null);
      },
    }), [tool, color, strokeWidth, currentPath, startPoint]);

  // 💾 SAVE FUNCTION
  const handleSave = async () => {
    if (!letterId || saving) return;
    try {
      setSaving(true);
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      await saveDrawingPath(letterId, uri);
      Alert.alert("Éxito", "Dibujo actualizado");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el dibujo");
    } finally {
        setSaving(false);
    }
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    Alert.alert("Limpiar", "¿Borrar todo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: 'destructive', onPress: () => {
            setPaths([]);
            setExistingImage(null);
        }}
    ]);
  };

  // HELPER: RENDER SAVED SHAPES
  const renderShape = (item: DrawingItem, index: number) => {
    if (item.type === 'pen' || item.type === 'eraser') {
      if (!item.points || item.points.length < 1) return null;
      const d = item.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return (
        <Path
          key={index}
          d={d}
          stroke={item.color}
          strokeWidth={item.width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    if (item.type === 'line' && item.start && item.end) {
      return (
        <Line
          key={index}
          x1={item.start.x} y1={item.start.y}
          x2={item.end.x} y2={item.end.y}
          stroke={item.color}
          strokeWidth={item.width}
          strokeLinecap="round"
        />
      );
    }
    if (item.type === 'circle' && item.start && item.end) {
      const r = Math.sqrt(
        Math.pow(item.end.x - item.start.x, 2) + Math.pow(item.end.y - item.start.y, 2)
      );
      return (
        <Circle
          key={index}
          cx={item.start.x} cy={item.start.y}
          r={r}
          stroke={item.color}
          strokeWidth={item.width}
          fill="none"
        />
      );
    }
    if (item.type === 'rect' && item.start && item.end) {
      const w = item.end.x - item.start.x;
      const h = item.end.y - item.start.y;
      return (
        <Rect
          key={index}
          x={w < 0 ? item.end.x : item.start.x}
          y={h < 0 ? item.end.y : item.start.y}
          width={Math.abs(w)}
          height={Math.abs(h)}
          stroke={item.color}
          strokeWidth={item.width}
          fill="none"
        />
      );
    }
  };

  // HELPER: RENDER CURRENT PREVIEW (What you are dragging right now)
  const renderPreview = () => {
    if (currentPath.length === 0) return null;

    if (tool === 'pen' || tool === 'eraser') {
       const d = currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
       return <Path d={d} stroke={tool === 'eraser' ? '#FFF' : color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    }
    
    if (startPoint) {
      // Create a temporary item to reuse renderShape logic
      const tempItem: DrawingItem = {
        type: tool,
        start: startPoint,
        end: currentPath[0],
        color: color,
        width: strokeWidth
      };
      return renderShape(tempItem, 9999);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🛠️ TOP TOOLBAR */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScroll}>
            <TouchableOpacity onPress={() => setTool('pen')} style={[styles.toolBtn, tool==='pen' && styles.activeTool]}>
                <Ionicons name="pencil" size={18} color={tool==='pen'?'#fff':'#333'} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setTool('eraser')} style={[styles.toolBtn, tool==='eraser' && styles.activeTool]}>
                <Ionicons name="tablet-landscape" size={18} color={tool==='eraser'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTool('line')} style={[styles.toolBtn, tool==='line' && styles.activeTool]}>
                <Ionicons name="resize" size={18} color={tool==='line'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTool('circle')} style={[styles.toolBtn, tool==='circle' && styles.activeTool]}>
                <Ionicons name="radio-button-off" size={18} color={tool==='circle'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTool('rect')} style={[styles.toolBtn, tool==='rect' && styles.activeTool]}>
                <Ionicons name="square-outline" size={18} color={tool==='rect'?'#fff':'#333'} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity onPress={handleUndo} style={styles.iconBtn}>
                <Ionicons name="arrow-undo" size={22} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClear} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={22} color="#d9534f" />
            </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { opacity: saving ? 0.7 : 1 }]}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={24} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* 🎨 CANVAS */}
      <View style={styles.canvasContainer}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.8 }} style={{flex:1}}>
            <View style={styles.canvas} {...panResponder.panHandlers}>
                
                {/* 1. Background Image */}
                {existingImage ? (
                    <Image 
                        source={{ uri: existingImage }} 
                        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', resizeMode: 'contain' }]} 
                    />
                ) : (
                    <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                )}

                {/* 2. SVG Layer */}
                <Svg style={styles.svg}>
                    {/* Saved Paths */}
                    {paths.map((item, index) => renderShape(item, index))}
                    
                    {/* Active Dragging Preview */}
                    {renderPreview()}
                </Svg>
            </View>
        </ViewShot>
      </View>

      {/* 🎛️ BOTTOM CONTROLS */}
      <View style={styles.bottomBar}>
        
        {/* Stroke Size Selector */}
        <View style={styles.strokeSelector}>
          <Text style={{fontSize:10, color:'#888', marginRight:10}}>Grosor:</Text>
          {STROKES.map(s => (
            <TouchableOpacity 
              key={s} 
              onPress={() => setStrokeWidth(s)}
              style={[styles.strokeBtn, strokeWidth === s && styles.activeStroke]}
            >
              <View style={{ width: s, height: s, borderRadius: s/2, backgroundColor: 'black' }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Color Palette */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.palette}>
          {COLORS.map(c => (
            <TouchableOpacity 
              key={c}
              onPress={() => { setColor(c); if(tool === 'eraser') setTool('pen'); }} 
              style={[
                styles.colorBtn, 
                { backgroundColor: c }, 
                (color === c && tool !== 'eraser') && styles.activeColor
              ]}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 10, paddingTop: 40,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2
  },
  toolsScroll: { alignItems: 'center', paddingHorizontal: 5 },
  iconBtn: { padding: 8 },
  toolBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#f8f9fa',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: '#eee'
  },
  activeTool: { backgroundColor: '#007bff', borderColor: '#0056b3' },
  separator: { width: 1, height: 25, backgroundColor: '#ddd', marginHorizontal: 8 },
  saveBtn: { backgroundColor: '#28a745', padding: 8, borderRadius: 20, width: 40, height: 40, justifyContent:'center', alignItems:'center' },
  
  canvasContainer: { flex: 1, margin: 10, borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: 'white' },
  canvas: { flex: 1 },
  svg: { flex: 1 },

  bottomBar: { backgroundColor: 'white', padding: 10, borderTopLeftRadius: 15, borderTopRightRadius: 15, elevation: 10 },
  strokeSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' },
  strokeBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 17, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 5 },
  activeStroke: { borderColor: '#007bff', backgroundColor: '#eef' },
  palette: { flexDirection: 'row', paddingLeft: 5 },
  colorBtn: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 6, borderWidth: 2, borderColor: 'white', elevation: 2 },
  activeColor: { borderColor: '#333', transform: [{scale: 1.15}] }
});