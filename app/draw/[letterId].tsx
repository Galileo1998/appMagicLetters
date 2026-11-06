import { AppIcon as Ionicons } from '../components/AppIcon';
import { ChildBackground } from '../components/ChildBackground';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import ViewShot from "react-native-view-shot";
import { getDrawingRecord, saveDrawingPath } from "../../src/repos/drawings_repo";

import { getLetter } from '../../src/repos/letters_repo';
import { canEditLetter, canvasPoint, strokePath, DrawingItem, DrawingState, Point, ShapeType } from '../../src/drawing/model';
import { DRAWING_TEMPLATES, templateStroke, GUIDE_PATHS, TemplateCategory } from '../../src/drawing/templates';
import { DrawingTemplatePicker } from '../../src/components/DrawingTemplatePicker';

type TemplateId = string;
const COLORS = [
  ['Negro','#000000'], ['Blanco','#FFFFFF'], ['Café','#795548'], ['Café oscuro','#4E342E'],
  ['Beige','#D7B899'], ['Piel clara','#FFDBAC'], ['Piel media','#C68642'], ['Piel oscura','#6B4423'],
  ['Rojo','#E53935'], ['Coral','#FF7043'], ['Naranja','#FB8C00'], ['Amarillo','#FDD835'],
  ['Verde claro','#8BC34A'], ['Verde','#388E3C'], ['Verde oscuro','#1B5E20'], ['Turquesa','#00ACC1'],
  ['Celeste','#81D4FA'], ['Azul','#1E88E5'], ['Azul oscuro','#1A237E'], ['Morado','#8E24AA'],
  ['Lila','#CE93D8'], ['Rosado','#F48FB1'], ['Fucsia','#D81B60'], ['Gris','#757575'],
];
const STROKES = [2, 5, 8, 12, 20];

function renderTemplate(template: TemplateId) {
  const guidePaths = GUIDE_PATHS[template];
  if (guidePaths) {
    return (
      <>
        {guidePaths.map((path, index) => (
          <Path key={`${template}-${index}`} {...templateStroke} d={path} />
        ))}
      </>
    );
  }

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
  const insets = useSafeAreaInsets();
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const compactControls = (windowHeight - insets.top - insets.bottom) / Math.max(1, fontScale) < 550;
  const [toolsExpanded, setToolsExpanded] = useState(false);
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
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory | 'Todas'>('Todas');
  const [guideVisible, setGuideVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [savedPreview, setSavedPreview] = useState<string | null>(null);
  const [redoPaths, setRedoPaths] = useState<DrawingItem[]>([]);
  const [smoothing, setSmoothing] = useState(0.25);
  const [filled, setFilled] = useState(false);
  const [area, setArea] = useState({ width: 360, height: 520 });
  const canvasWidth = Math.min(area.width, area.height * 360 / 520);
  const canvasHeight = canvasWidth * 520 / 360;
  const gesture = useRef<{ points: Point[]; start: Point | null }>({ points: [], start: null });
  const settings = useRef({ tool, color, strokeWidth, editable, saving, smoothing, filled, canvasWidth, canvasHeight });
  settings.current = { tool, color, strokeWidth, editable, saving, smoothing, filled, canvasWidth, canvasHeight };

  const visibleTemplates = templateCategory === 'Todas'
    ? DRAWING_TEMPLATES
    : DRAWING_TEMPLATES.filter((item) => item.category === templateCategory);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setEditable(false);
    async function load() {
      if (!letterId) return;
      try {
        const [prevDrawing, letter] = await Promise.all([getDrawingRecord(letterId), getLetter(letterId)]);
        if (!active) return;
        const canEdit = canEditLetter(letter?.status);
        setAllowed(canEdit);
        setSavedPreview(prevDrawing?.file_path ?? null);
        setDescription(prevDrawing?.description ?? '');
        setPaths([]); setExistingImage(null); setTemplate(null); setRedoPaths([]);
        if (prevDrawing) {
          let state: DrawingState | null = null;
          try { state = prevDrawing.editor_state ? JSON.parse(prevDrawing.editor_state) : null; } catch { /* legacy PNG */ }
          if (state?.version === 1 && Array.isArray(state.paths)) {
            setPaths(state.paths); setTemplate(state.template); setExistingImage(state.baseImage);
          } else { setExistingImage(prevDrawing.file_path); }
        }
        setEditable(!prevDrawing && canEdit);
      } catch {
        if (active) Alert.alert('Error', 'No se pudo abrir el dibujo. Intenta nuevamente.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [letterId]));

  // Keep the responder stable through a stroke. Coordinates use a fixed 360×520 surface.
  const panResponder = useMemo(() => {
    const point = (evt: any) => canvasPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY,
      settings.current.canvasWidth || 360, settings.current.canvasHeight || 520);
    const finish = () => {
      const g = gesture.current, opts = settings.current;
      if (!opts.editable || opts.saving || !g.start || !g.points.length) return;
      const free = ['pen', 'marker', 'eraser'].includes(opts.tool);
      setPaths(prev => [...prev, { type: opts.tool, points: free ? g.points : undefined,
        start: g.start!, end: g.points[g.points.length - 1], color: opts.tool === 'eraser' ? '#FFFFFF' : opts.color,
        width: opts.strokeWidth, fill: opts.filled }]);
      setRedoPaths([]); gesture.current = { points: [], start: null };
      setCurrentPath([]); setStartPoint(null);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => settings.current.editable && !settings.current.saving,
      onMoveShouldSetPanResponder: () => settings.current.editable && !settings.current.saving,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: evt => {
        if (evt.nativeEvent.touches.length > 1) return;
        const p = point(evt); gesture.current = { points: [p], start: p };
        setStartPoint(p); setCurrentPath([p]);
      },
      onPanResponderMove: evt => {
        const g = gesture.current;
        if (!g.start || evt.nativeEvent.touches.length > 1) return;
        let p = point(evt);
        if (['pen', 'marker', 'eraser'].includes(settings.current.tool)) {
          const last = g.points[g.points.length - 1], smooth = settings.current.smoothing;
          p = { x: p.x * (1 - smooth) + last.x * smooth, y: p.y * (1 - smooth) + last.y * smooth };
          if (Math.hypot(p.x - last.x, p.y - last.y) < 0.3) return;
          g.points.push(p);
        } else { g.points = [p]; }
        setCurrentPath([...g.points]);
      },
      onPanResponderRelease: evt => {
        if (gesture.current.start) gesture.current.points.push(point(evt));
        finish();
      },
      onPanResponderTerminate: () => {
        gesture.current = { points: [], start: null }; setCurrentPath([]); setStartPoint(null);
      },
    });
  }, []);

  // 💾 SAVE FUNCTION
  const handleSave = async () => {
    if (!letterId || saving || !editable || !allowed) return;
    if (!description.trim()) {
      Alert.alert("Descripción requerida", "Explica qué representa el dibujo antes de guardarlo.");
      return;
    }
    try {
      setSaving(true);
      setGuideVisible(false);

      // En Android, KeyboardAvoidingView reduce la altura del lienzo mientras el
      // teclado está abierto. Si capturamos en ese estado, la parte inferior del
      // dibujo queda fuera del PNG. Cerramos el teclado y esperamos a que termine
      // la restauración del layout antes de tomar la captura.
      if (Keyboard.isVisible()) {
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            subscription.remove();
            resolve();
          };
          const subscription = Keyboard.addListener('keyboardDidHide', finish);
          const timeout = setTimeout(finish, 1200);
          Keyboard.dismiss();
        });
      } else {
        Keyboard.dismiss();
      }

      // Esperamos varios cuadros para que el lienzo recupere sus dimensiones y
      // para que la guía visual desaparezca de la imagen final.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      });

      const viewShot = viewShotRef.current;
      if (!viewShot?.capture) throw new Error('El lienzo no está listo para capturarse.');
      const uri = await viewShot.capture();
      if (!uri) throw new Error('No se pudo capturar el lienzo completo.');
      await saveDrawingPath(letterId, uri, description, { version: 1, paths, template, baseImage: existingImage });
      setSavedPreview(uri); setEditable(false);
      Alert.alert("Éxito", "Dibujo actualizado");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el dibujo");
    } finally {
      setGuideVisible(true);
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (!editable || saving || !paths.length) return;
    setRedoPaths(prev => [...prev, paths[paths.length - 1]]);
    setPaths(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (!editable || saving) return;
    Alert.alert("Limpiar", "¿Borrar todo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: 'destructive', onPress: () => {
            setRedoPaths([]); setPaths([]);
            setExistingImage(null);
            setTemplate(null);
        }}
    ]);
  };

  const applyTemplate = (nextTemplate: TemplateId) => {
    if (!editable || saving) return;
    const replaceDrawing = () => {
      setRedoPaths([]);
      setPaths([]);
      setCurrentPath([]);
      setExistingImage(null);
      setTemplate(nextTemplate);
      setTool('pen');
      setTemplateModalVisible(false);
    };

    if (paths.length > 0 || existingImage) {
      Alert.alert(
        "Cambiar guía",
        "La nueva guía borrará los trazos actuales del lienzo. ¿Deseas continuar?",
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
    const choices = visibleTemplates.filter((item) => item.id !== template);
    const selected = choices[Math.floor(Math.random() * choices.length)] ?? visibleTemplates[0] ?? DRAWING_TEMPLATES[0];
    applyTemplate(selected.id);
  };

  // HELPER: RENDER SAVED SHAPES
  const renderShape = (item: DrawingItem, index: number) => {
    if (item.type === 'pen' || item.type === 'marker' || item.type === 'eraser') {
      if (!item.points || item.points.length < 1) return null;
      const d = strokePath(item.points);
      return (
        <Path
          key={index}
          d={d}
          opacity={item.type === 'marker' ? 0.35 : 1}
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
          fill={item.fill ? item.color : "none"}
        />
      );
    }
    if (item.start && item.end && ['ellipse', 'triangle', 'star'].includes(item.type)) {
      const x = Math.min(item.start.x, item.end.x), y = Math.min(item.start.y, item.end.y);
      const w = Math.abs(item.end.x - item.start.x), h = Math.abs(item.end.y - item.start.y);
      const props = { stroke: item.color, strokeWidth: item.width, fill: item.fill ? item.color : 'none' };
      if (item.type === 'ellipse') return <Ellipse key={index} {...props} cx={x+w/2} cy={y+h/2} rx={w/2} ry={h/2} />;
      const points = item.type === 'triangle' ? `${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}` :
        Array.from({ length: 10 }, (_, i) => {
          const angle = -Math.PI/2 + i*Math.PI/5, factor = i % 2 ? 0.45 : 1;
          return `${x+w/2+Math.cos(angle)*w/2*factor},${y+h/2+Math.sin(angle)*h/2*factor}`;
        }).join(' ');
      return <Polygon key={index} {...props} points={points} />;
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
          fill={item.fill ? item.color : "none"}
        />
      );
    }
  };

  // HELPER: RENDER CURRENT PREVIEW (What you are dragging right now)
  const renderPreview = () => {
    if (currentPath.length === 0) return null;

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
       const d = strokePath(currentPath);
       return <Path d={d} opacity={tool === 'marker' ? 0.35 : 1} stroke={tool === 'eraser' ? '#FFF' : color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    }

    if (startPoint) {
      // Create a temporary item to reuse renderShape logic
      const tempItem: DrawingItem = {
        type: tool,
        start: startPoint,
        end: currentPath[0],
        color: color,
        width: strokeWidth, fill: filled
      };
      return renderShape(tempItem, 9999);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  return (
    <View style={[styles.container, { paddingLeft: insets.left, paddingRight: insets.right }]}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ChildBackground />
      {/* 🛠️ TOP TOOLBAR */}
      <View pointerEvents={saving ? 'none' : 'auto'} style={[styles.toolbar, { paddingTop: Math.max(insets.top + 8, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {editable ? <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flex: 1, height: Math.max(52, 44 * fontScale) }} contentContainerStyle={styles.toolsScroll}>
            {([['marker','Marcador'], ['ellipse','Óvalo'], ['triangle','Triángulo'], ['star','Estrella']] as const).map(([value,label]) => (
              <TouchableOpacity key={value} accessibilityLabel={label} onPress={() => setTool(value)} style={[styles.toolBtn, tool === value && styles.activeTool]}>
                <Text>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity accessibilityLabel="Rellenar figuras" onPress={() => setFilled(v => !v)} style={styles.iconBtn}><Text>{filled ? 'Con relleno' : 'Contorno'}</Text></TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Rehacer" disabled={!redoPaths.length} onPress={() => {
              const item = redoPaths[redoPaths.length - 1]; if (!item) return;
              setPaths(prev => [...prev, item]); setRedoPaths(prev => prev.slice(0,-1));
            }} style={styles.iconBtn}><Text>Rehacer</Text></TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Lápiz" onPress={() => setTool('pen')} style={[styles.toolBtn, tool==='pen' && styles.activeTool]}>
                <Ionicons name="pencil" size={18} color={tool==='pen'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity accessibilityLabel="Borrador" onPress={() => setTool('eraser')} style={[styles.toolBtn, tool==='eraser' && styles.activeTool]}>
                <Ionicons name="tablet-landscape" size={18} color={tool==='eraser'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity accessibilityLabel="Línea" onPress={() => setTool('line')} style={[styles.toolBtn, tool==='line' && styles.activeTool]}>
                <Ionicons name="resize" size={18} color={tool==='line'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity accessibilityLabel="Círculo" onPress={() => setTool('circle')} style={[styles.toolBtn, tool==='circle' && styles.activeTool]}>
                <Ionicons name="radio-button-off" size={18} color={tool==='circle'?'#fff':'#333'} />
            </TouchableOpacity>

            <TouchableOpacity accessibilityLabel="Rectángulo" onPress={() => setTool('rect')} style={[styles.toolBtn, tool==='rect' && styles.activeTool]}>
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
        </ScrollView> : <Text style={{ flex: 1, textAlign: 'center', fontWeight: '700' }}>Dibujo guardado</Text>}

        {editable && <TouchableOpacity disabled={saving} accessibilityLabel="Guardar dibujo" onPress={handleSave} style={[styles.saveBtn, { opacity: saving ? 0.7 : 1 }]}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={24} color="#fff" />}
        </TouchableOpacity>}
      </View>
      {!editable && <View style={{ padding: 12, alignItems: 'center' }}>
        <Text>{allowed ? 'El dibujo y su descripción están en modo de consulta.' : 'Carta preparada para envío. El dibujo está bloqueado.'}</Text>
        {allowed && <TouchableOpacity accessibilityLabel="Editar dibujo" onPress={async () => {
          const letter = await getLetter(letterId);
          if (!canEditLetter(letter?.status)) { setAllowed(false); return; }
          setEditable(true);
        }} style={{ padding: 12 }}><Text style={{ color: '#1e62d0', fontWeight: '800' }}>Editar dibujo</Text></TouchableOpacity>}
      </View>}

      {/* 🎨 CANVAS */}
      <View testID="drawing-workspace" style={styles.canvasContainer} onLayout={e => setArea(e.nativeEvent.layout)}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.8 }} style={{ width: canvasWidth, height: canvasHeight }}>
            <View
              testID="drawing-canvas"
              style={styles.canvas}
              pointerEvents={saving || !editable ? 'none' : 'auto'}
              {...panResponder.panHandlers}
            >

                {/* 1. White background and saved image */}
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.whiteCanvas]} />
                {(!editable ? savedPreview : existingImage) ? (
                    <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image
                        source={{ uri: (!editable ? savedPreview : existingImage)! }}
                        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', resizeMode: 'contain' }]}
                    /></View>
                ) : null}

                {/* 2. Offline dotted guide (hidden automatically while saving) */}
                {editable && guideVisible && template && !existingImage && (
                  <Svg
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    viewBox="0 0 360 520"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {renderTemplate(template)}
                  </Svg>
                )}

                {/* 3. SVG Layer */}
                <Svg pointerEvents="none" style={styles.svg} viewBox="0 0 360 520">
                    {/* Saved Paths */}
                    {editable && paths.map((item, index) => renderShape(item, index))}

                    {/* Active Dragging Preview */}
                    {editable && renderPreview()}
                </Svg>
            </View>
        </ViewShot>
      </View>

      {/* 🎛️ BOTTOM CONTROLS */}
      <View testID="drawing-controls" pointerEvents={saving ? 'none' : 'auto'} style={[
        styles.bottomBar,
        { paddingBottom: Math.max(insets.bottom + 10, 14) },
      ]}>
        <TextInput
          editable={editable && !saving}
          multiline
          value={description}
          onChangeText={setDescription}
          accessibilityLabel="Descripción del dibujo"
          placeholder="¿Qué representa este dibujo?"
          style={styles.descriptionInput}
        />

        {editable && compactControls && <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: toolsExpanded }}
          onPress={() => setToolsExpanded(value => !value)}
          style={styles.toolsToggle}
        ><Text style={styles.toolsToggleText}>{toolsExpanded ? 'Ocultar herramientas' : 'Mostrar herramientas'}</Text></TouchableOpacity>}
        {editable && (!compactControls || toolsExpanded) && <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled"
          style={{ maxHeight: Math.max(80, windowHeight * 0.27), flexGrow: 0 }}>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text>Suavizado:</Text>
            {[[0, 'Directo'], [0.25, 'Normal'], [0.55, 'Suave']].map(([value,label]) => <TouchableOpacity key={label} onPress={() => setSmoothing(Number(value))} style={{ padding: 10, backgroundColor: smoothing === value ? '#d8eee8' : '#fff' }}><Text>{label}</Text></TouchableOpacity>)}
          </View>
          {/* Color Palette */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.palette} contentContainerStyle={styles.paletteContent}>
            {COLORS.map(([label,c]) => (
              <TouchableOpacity
                key={c}
                accessibilityLabel={label}
                onPress={() => { setColor(c); if(tool === 'eraser') setTool('pen'); }}
                style={[
                  styles.colorBtn,
                  { backgroundColor: c },
                  (color === c && tool !== 'eraser') && styles.activeColor
                ]}
              />
            ))}
          </ScrollView>
        </ScrollView>}
      </View>

      {templateModalVisible && <DrawingTemplatePicker
        category={templateCategory}
        templates={visibleTemplates}
        selectedTemplate={template}
        onClose={() => setTemplateModalVisible(false)}
        onCategoryChange={setTemplateCategory}
        onSelect={applyTemplate}
        onRandom={generateRandomTemplate}
        renderTemplate={renderTemplate}
      />}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  keyboardArea: { flex: 1 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingBottom: 10,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2
  },
  toolsScroll: { alignItems: 'center', paddingHorizontal: 5 },
  iconBtn: { padding: 8 },
  toolBtn: {
    minWidth: 44, minHeight: 44, paddingHorizontal: 6, borderRadius: 8, backgroundColor: '#f8f9fa',
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

  canvasContainer: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', margin: 10, borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: 'white' },
  canvas: { flex: 1 },
  whiteCanvas: { backgroundColor: '#fff' },
  svg: { flex: 1 },

  bottomBar: { backgroundColor: 'white', padding: 10, borderTopLeftRadius: 15, borderTopRightRadius: 15, elevation: 10 },
  descriptionInput: { minHeight: 40, maxHeight: 110, backgroundColor: '#f2f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  toolsToggle: { minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef4ff', borderRadius: 8, marginBottom: 4 },
  toolsToggleText: { color: '#1e62d0', fontWeight: '700', textAlign: 'center' },
  strokeSelector: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, justifyContent: 'center' },
  strokeBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 17, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 5 },
  activeStroke: { borderColor: '#007bff', backgroundColor: '#eef' },
  palette: { height: 48, flexGrow: 0, flexShrink: 0 },
  paletteContent: { alignItems: 'center', paddingHorizontal: 5 },
  colorBtn: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 6, borderWidth: 2, borderColor: 'white', elevation: 2 },
  activeColor: { borderColor: '#333', transform: [{scale: 1.15}] },
});
