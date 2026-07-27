import { AppIcon as Ionicons } from '../components/AppIcon';
import { ChildBackground } from '../components/ChildBackground';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import ViewShot from "react-native-view-shot";
import { getDrawingRecord, saveDrawingPath } from "../../src/repos/drawings_repo";

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

type TemplateId = 'house' | 'tree' | 'butterfly' | 'fish' | 'rocket' | 'flower';

const DRAWING_TEMPLATES: { id: TemplateId; name: string; emoji: string }[] = [
  { id: 'house', name: 'Mi casa', emoji: '🏠' },
  { id: 'tree', name: 'Árbol feliz', emoji: '🌳' },
  { id: 'butterfly', name: 'Mariposa', emoji: '🦋' },
  { id: 'fish', name: 'Pez', emoji: '🐟' },
  { id: 'rocket', name: 'Cohete', emoji: '🚀' },
  { id: 'flower', name: 'Jardín', emoji: '🌼' },
];

const templateStroke = {
  fill: "none",
  stroke: "#667085",
  strokeWidth: 4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function renderTemplate(template: TemplateId) {
  switch (template) {
    case 'house':
      return (
        <>
          <Circle {...templateStroke} cx="292" cy="78" r="34" />
          <Line {...templateStroke} x1="292" y1="25" x2="292" y2="5" />
          <Line {...templateStroke} x1="247" y1="48" x2="230" y2="36" />
          <Line {...templateStroke} x1="337" y1="48" x2="354" y2="36" />
          <Polygon {...templateStroke} points="55,250 180,130 305,250" />
          <Rect {...templateStroke} x="78" y="250" width="204" height="180" rx="4" />
          <Rect {...templateStroke} x="155" y="330" width="55" height="100" rx="3" />
          <Rect {...templateStroke} x="98" y="280" width="48" height="48" rx="3" />
          <Rect {...templateStroke} x="218" y="280" width="44" height="48" rx="3" />
          <Path {...templateStroke} d="M18 430 Q90 395 160 430 T342 430" />
        </>
      );
    case 'tree':
      return (
        <>
          <Circle {...templateStroke} cx="180" cy="175" r="86" />
          <Circle {...templateStroke} cx="116" cy="205" r="58" />
          <Circle {...templateStroke} cx="244" cy="205" r="58" />
          <Path {...templateStroke} d="M155 405 Q165 310 150 247 M205 405 Q195 310 212 245" />
          <Path {...templateStroke} d="M180 330 130 278 M180 315 230 270" />
          <Path {...templateStroke} d="M120 405 Q180 382 240 405 L255 450 H105Z" />
          <Circle {...templateStroke} cx="137" cy="164" r="10" />
          <Circle {...templateStroke} cx="213" cy="135" r="10" />
          <Circle {...templateStroke} cx="240" cy="218" r="10" />
        </>
      );
    case 'butterfly':
      return (
        <>
          <Ellipse {...templateStroke} cx="180" cy="275" rx="20" ry="105" />
          <Path {...templateStroke} d="M160 245 C75 105 25 205 85 285 C28 350 92 430 163 320" />
          <Path {...templateStroke} d="M200 245 C285 105 335 205 275 285 C332 350 268 430 197 320" />
          <Path {...templateStroke} d="M168 176 Q135 130 118 150 M192 176 Q225 130 242 150" />
          <Circle {...templateStroke} cx="180" cy="168" r="20" />
          <Circle {...templateStroke} cx="105" cy="238" r="20" />
          <Circle {...templateStroke} cx="255" cy="238" r="20" />
          <Circle {...templateStroke} cx="105" cy="345" r="16" />
          <Circle {...templateStroke} cx="255" cy="345" r="16" />
        </>
      );
    case 'fish':
      return (
        <>
          <Ellipse {...templateStroke} cx="168" cy="270" rx="115" ry="78" />
          <Polygon {...templateStroke} points="278,270 345,205 342,335" />
          <Circle {...templateStroke} cx="105" cy="250" r="8" />
          <Path {...templateStroke} d="M68 284 Q98 310 130 285" />
          <Path {...templateStroke} d="M163 192 Q190 145 225 196 M162 347 Q190 395 225 342" />
          <Path {...templateStroke} d="M18 435 Q60 410 102 435 T186 435 T270 435 T354 435" />
          <Circle {...templateStroke} cx="58" cy="125" r="12" />
          <Circle {...templateStroke} cx="85" cy="85" r="8" />
        </>
      );
    case 'rocket':
      return (
        <>
          <Path {...templateStroke} d="M180 65 C115 125 115 285 180 360 C245 285 245 125 180 65Z" />
          <Circle {...templateStroke} cx="180" cy="190" r="38" />
          <Path {...templateStroke} d="M132 270 75 355 142 330 M228 270 285 355 218 330" />
          <Path {...templateStroke} d="M157 350 Q180 455 203 350" />
          <Path {...templateStroke} d="M168 365 Q180 425 192 365" />
          <Circle {...templateStroke} cx="75" cy="105" r="8" />
          <Circle {...templateStroke} cx="292" cy="155" r="10" />
          <Path {...templateStroke} d="m292 65 7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2Z" />
        </>
      );
    case 'flower':
      return (
        <>
          <Circle {...templateStroke} cx="180" cy="205" r="38" />
          <Ellipse {...templateStroke} cx="180" cy="132" rx="35" ry="55" />
          <Ellipse {...templateStroke} cx="180" cy="278" rx="35" ry="55" />
          <Ellipse {...templateStroke} cx="107" cy="205" rx="55" ry="35" />
          <Ellipse {...templateStroke} cx="253" cy="205" rx="55" ry="35" />
          <Ellipse {...templateStroke} cx="128" cy="153" rx="35" ry="50" transform="rotate(-45 128 153)" />
          <Ellipse {...templateStroke} cx="232" cy="153" rx="35" ry="50" transform="rotate(45 232 153)" />
          <Line {...templateStroke} x1="180" y1="316" x2="180" y2="455" />
          <Path {...templateStroke} d="M180 380 Q115 330 110 392 Q145 405 180 380Z" />
          <Path {...templateStroke} d="M180 415 Q245 365 250 427 Q215 440 180 415Z" />
          <Path {...templateStroke} d="M25 455 Q90 425 155 455 T335 455" />
        </>
      );
  }
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
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  // LOAD BACKGROUND IMAGE
  useEffect(() => {
    async function load() {
      if(!letterId) return;
      const prevDrawing = await getDrawingRecord(letterId);
      if(prevDrawing) {
        setExistingImage(prevDrawing.file_path);
        setDescription(prevDrawing.description);
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
    if (!description.trim()) {
      Alert.alert("Descripción requerida", "Explica qué representa el dibujo antes de guardarlo.");
      return;
    }
    try {
      setSaving(true);
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      await saveDrawingPath(letterId, uri, description);
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
            setTemplate(null);
        }}
    ]);
  };

  const applyTemplate = (nextTemplate: TemplateId) => {
    const replaceDrawing = () => {
      setPaths([]);
      setCurrentPath([]);
      setExistingImage(null);
      setTemplate(nextTemplate);
      setTool('pen');
      setTemplateModalVisible(false);
    };

    if (paths.length > 0 || existingImage) {
      Alert.alert(
        "Cambiar plantilla",
        "La plantilla reemplazará el dibujo que está en el lienzo. ¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", onPress: replaceDrawing },
        ]
      );
      return;
    }

    replaceDrawing();
  };

  const generateRandomTemplate = () => {
    const choices = DRAWING_TEMPLATES.filter((item) => item.id !== template);
    const selected = choices[Math.floor(Math.random() * choices.length)] ?? DRAWING_TEMPLATES[0];
    applyTemplate(selected.id);
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
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ChildBackground />
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

            <TouchableOpacity
              accessibilityLabel="Abrir plantillas de dibujo"
              onPress={() => setTemplateModalVisible(true)}
              style={styles.templateToolbarBtn}
            >
              <Ionicons name="sparkles" size={18} color="#7c3aed" />
              <Text style={styles.templateToolbarText}>Plantillas</Text>
            </TouchableOpacity>

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

                {/* 2. Offline template layer */}
                {template && !existingImage && (
                  <Svg
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    viewBox="0 0 360 520"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <Rect x="0" y="0" width="360" height="520" fill="#fffef8" />
                    {renderTemplate(template)}
                  </Svg>
                )}

                {/* 3. SVG Layer */}
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
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="¿Qué representa este dibujo?"
          style={styles.descriptionInput}
        />
        
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

      <Modal
        visible={templateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.templateModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Plantillas para dibujar</Text>
                <Text style={styles.modalSubtitle}>Funcionan sin conexión a internet</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Cerrar plantillas"
                onPress={() => setTemplateModalVisible(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={generateRandomTemplate} style={styles.randomTemplateBtn}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.randomTemplateText}>Generar una plantilla al azar</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.templateGrid}>
              {DRAWING_TEMPLATES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => applyTemplate(item.id)}
                  style={[styles.templateCard, template === item.id && styles.activeTemplateCard]}
                >
                  <View style={styles.templatePreview}>
                    <Svg width="100%" height="100%" viewBox="0 0 360 520">
                      {renderTemplate(item.id)}
                    </Svg>
                  </View>
                  <Text style={styles.templateEmoji}>{item.emoji}</Text>
                  <Text style={styles.templateName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  keyboardArea: { flex: 1 },
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
  templateToolbarBtn: {
    minWidth: 78, height: 36, borderRadius: 8, paddingHorizontal: 8,
    flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f3e8ff', borderWidth: 1, borderColor: '#d8b4fe', marginHorizontal: 3
  },
  templateToolbarText: { fontSize: 11, fontWeight: '700', color: '#6d28d9' },
  separator: { width: 1, height: 25, backgroundColor: '#ddd', marginHorizontal: 8 },
  saveBtn: { backgroundColor: '#28a745', padding: 8, borderRadius: 20, width: 40, height: 40, justifyContent:'center', alignItems:'center' },
  
  canvasContainer: { flex: 1, margin: 10, borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: 'white' },
  canvas: { flex: 1 },
  svg: { flex: 1 },

  bottomBar: { backgroundColor: 'white', padding: 10, borderTopLeftRadius: 15, borderTopRightRadius: 15, elevation: 10 },
  descriptionInput: { backgroundColor: '#f2f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  strokeSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' },
  strokeBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 17, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 5 },
  activeStroke: { borderColor: '#007bff', backgroundColor: '#eef' },
  palette: { flexDirection: 'row', paddingLeft: 5 },
  colorBtn: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 6, borderWidth: 2, borderColor: 'white', elevation: 2 },
  activeColor: { borderColor: '#333', transform: [{scale: 1.15}] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.48)', justifyContent: 'flex-end' },
  templateModal: {
    maxHeight: '84%', backgroundColor: '#fffdf7', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#342b4a' },
  modalSubtitle: { marginTop: 3, fontSize: 12, color: '#667085' },
  modalClose: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f2f4f7',
    alignItems: 'center', justifyContent: 'center'
  },
  modalCloseText: { fontSize: 28, lineHeight: 30, color: '#475467' },
  randomTemplateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, marginBottom: 14
  },
  randomTemplateText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  templateGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 12
  },
  templateCard: {
    width: '48%', height: 180, marginBottom: 12, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#e4e7ec', overflow: 'hidden', alignItems: 'center', paddingBottom: 8
  },
  activeTemplateCard: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  templatePreview: { width: '100%', height: 125, padding: 8 },
  templateEmoji: { position: 'absolute', right: 8, top: 7, fontSize: 20 },
  templateName: { fontSize: 13, fontWeight: '700', color: '#344054' }
});
