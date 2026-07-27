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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

type TemplateCategory = 'Hogar' | 'Animales' | 'Transporte' | 'Cotidiano' | 'Paisajes';
type TemplateId = string;

type DrawingTemplate = {
  id: TemplateId;
  name: string;
  emoji: string;
  category: TemplateCategory;
};

const DRAWING_TEMPLATES: DrawingTemplate[] = [
  { id: 'home-house', name: 'Mi casa', emoji: '🏠', category: 'Hogar' },
  { id: 'home-family', name: 'Mi familia', emoji: '👨‍👩‍👧', category: 'Hogar' },
  { id: 'home-bedroom', name: 'Mi habitación', emoji: '🛏️', category: 'Hogar' },
  { id: 'home-kitchen', name: 'La cocina', emoji: '🍳', category: 'Hogar' },
  { id: 'home-table', name: 'Mesa familiar', emoji: '🍽️', category: 'Hogar' },
  { id: 'home-yard', name: 'Patio de casa', emoji: '🌿', category: 'Hogar' },
  { id: 'home-birthday', name: 'Cumpleaños', emoji: '🎂', category: 'Hogar' },
  { id: 'home-window', name: 'Ventana y flores', emoji: '🪟', category: 'Hogar' },
  { id: 'home-laundry', name: 'Ropa tendida', emoji: '👕', category: 'Hogar' },
  { id: 'home-neighborhood', name: 'Mi vecindario', emoji: '🏘️', category: 'Hogar' },

  { id: 'animal-dog', name: 'Perrito', emoji: '🐶', category: 'Animales' },
  { id: 'animal-cat', name: 'Gatito', emoji: '🐱', category: 'Animales' },
  { id: 'animal-bird', name: 'Pajarito', emoji: '🐦', category: 'Animales' },
  { id: 'animal-fish', name: 'Pez', emoji: '🐟', category: 'Animales' },
  { id: 'animal-butterfly', name: 'Mariposa', emoji: '🦋', category: 'Animales' },
  { id: 'animal-rabbit', name: 'Conejito', emoji: '🐰', category: 'Animales' },
  { id: 'animal-turtle', name: 'Tortuga', emoji: '🐢', category: 'Animales' },
  { id: 'animal-horse', name: 'Caballito', emoji: '🐴', category: 'Animales' },
  { id: 'animal-cow', name: 'Vaquita', emoji: '🐄', category: 'Animales' },
  { id: 'animal-chicken', name: 'Gallinita', emoji: '🐔', category: 'Animales' },

  { id: 'transport-bus', name: 'Bus', emoji: '🚌', category: 'Transporte' },
  { id: 'transport-car', name: 'Automóvil', emoji: '🚗', category: 'Transporte' },
  { id: 'transport-bike', name: 'Bicicleta', emoji: '🚲', category: 'Transporte' },
  { id: 'transport-motorcycle', name: 'Motocicleta', emoji: '🏍️', category: 'Transporte' },
  { id: 'transport-truck', name: 'Camión', emoji: '🚚', category: 'Transporte' },
  { id: 'transport-boat', name: 'Bote', emoji: '⛵', category: 'Transporte' },
  { id: 'transport-plane', name: 'Avión', emoji: '✈️', category: 'Transporte' },
  { id: 'transport-train', name: 'Tren', emoji: '🚂', category: 'Transporte' },
  { id: 'transport-tractor', name: 'Tractor', emoji: '🚜', category: 'Transporte' },
  { id: 'transport-ambulance', name: 'Ambulancia', emoji: '🚑', category: 'Transporte' },

  { id: 'daily-school', name: 'Mi escuela', emoji: '🏫', category: 'Cotidiano' },
  { id: 'daily-backpack', name: 'Mochila', emoji: '🎒', category: 'Cotidiano' },
  { id: 'daily-book', name: 'Libro', emoji: '📖', category: 'Cotidiano' },
  { id: 'daily-ball', name: 'Pelota', emoji: '⚽', category: 'Cotidiano' },
  { id: 'daily-kite', name: 'Cometa', emoji: '🪁', category: 'Cotidiano' },
  { id: 'daily-umbrella', name: 'Paraguas', emoji: '☂️', category: 'Cotidiano' },
  { id: 'daily-cup', name: 'Taza', emoji: '☕', category: 'Cotidiano' },
  { id: 'daily-fruit', name: 'Canasta de frutas', emoji: '🍎', category: 'Cotidiano' },
  { id: 'daily-guitar', name: 'Guitarra', emoji: '🎸', category: 'Cotidiano' },
  { id: 'daily-playground', name: 'Parque de juegos', emoji: '🛝', category: 'Cotidiano' },

  { id: 'land-mountain', name: 'Montañas', emoji: '⛰️', category: 'Paisajes' },
  { id: 'land-beach', name: 'Playa', emoji: '🏖️', category: 'Paisajes' },
  { id: 'land-river', name: 'Río', emoji: '🏞️', category: 'Paisajes' },
  { id: 'land-forest', name: 'Bosque', emoji: '🌲', category: 'Paisajes' },
  { id: 'land-farm', name: 'Finca', emoji: '🌾', category: 'Paisajes' },
  { id: 'land-village', name: 'Comunidad', emoji: '🏡', category: 'Paisajes' },
  { id: 'land-rainbow', name: 'Arcoíris', emoji: '🌈', category: 'Paisajes' },
  { id: 'land-night', name: 'Noche con luna', emoji: '🌙', category: 'Paisajes' },
  { id: 'land-waterfall', name: 'Cascada', emoji: '💧', category: 'Paisajes' },
  { id: 'land-sunfield', name: 'Campo soleado', emoji: '🌻', category: 'Paisajes' },
];

const TEMPLATE_CATEGORIES: (TemplateCategory | 'Todas')[] = [
  'Todas',
  'Hogar',
  'Animales',
  'Transporte',
  'Cotidiano',
  'Paisajes',
];

const templateStroke = {
  fill: "none",
  stroke: "#98A2B3",
  strokeWidth: 3.5,
  strokeDasharray: "7 9",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const GUIDE_PATHS: Record<TemplateId, string[]> = {
  'home-house': ['M55 245 180 125 305 245V430H55Z M145 430V330H215V430 M90 280H135V325H90Z M230 280H275V325H230Z', 'M25 430Q95 395 165 430T340 430 M290 85A35 35 0 1 0 289 85'],
  'home-family': ['M85 145A35 35 0 1 0 84 145 M275 145A35 35 0 1 0 274 145 M180 190A30 30 0 1 0 179 190', 'M85 180V330M45 240H125M60 430 85 330 110 430 M275 180V330M235 240H315M250 430 275 330 300 430 M180 220V340M145 275H215M155 430 180 340 205 430'],
  'home-bedroom': ['M45 310H315V420H45Z M65 245H150V310H65Z M150 275H295V310H150Z M70 420V455M290 420V455', 'M235 100H315V220H235Z M275 100V220M235 160H315 M70 110H180V205H70Z'],
  'home-kitchen': ['M40 190H320V420H40Z M70 230H155V320H70Z M195 230H290V320H195Z M70 350H290', 'M95 125H265V190H95Z M130 125V190M225 125V190 M115 265A18 18 0 1 0 114 265 M245 265A18 18 0 1 0 244 265'],
  'home-table': ['M55 260H305V315H55Z M85 315V440M275 315V440 M90 175A38 38 0 1 0 89 175 M180 160A38 38 0 1 0 179 160 M270 175A38 38 0 1 0 269 175', 'M90 215V260M180 200V260M270 215V260 M135 280A45 18 0 1 0 225 280A45 18 0 1 0 135 280'],
  'home-yard': ['M25 430Q100 390 180 430T340 430 M80 420V230M55 280Q80 220 105 280M45 245Q80 185 115 245', 'M245 410V285 M210 300Q245 235 280 300 M205 345Q245 275 285 345 M275 100A38 38 0 1 0 274 100'],
  'home-birthday': ['M85 260H275V400H85Z M110 215H250V260H110Z M135 170H225V215H135Z', 'M150 170V130M180 170V125M210 170V130 M145 300Q180 330 215 300 M145 350H215'],
  'home-window': ['M70 90H290V350H70Z M180 90V350M70 220H290 M45 350H315', 'M100 420Q125 350 150 420M210 420Q235 350 260 420 M125 375V455M235 375V455'],
  'home-laundry': ['M35 150Q180 205 325 150 M65 165V430M295 165V430', 'M75 175 125 185 118 270 82 265Z M145 188H215V275H145Z M235 180 285 170 278 265 242 270Z M35 430H325'],
  'home-neighborhood': ['M25 430V260L90 200 155 260V430 M110 430V230L180 165 250 230V430 M215 430V275L285 220 340 275V430', 'M55 300H95V340H55Z M155 265H205V315H155Z M270 305H310V345H270Z M15 430H345'],

  'animal-dog': ['M90 235Q80 140 150 150Q180 110 210 150Q280 140 270 235Q290 330 180 390Q70 330 90 235Z', 'M105 170 55 115 65 230 M255 170 305 115 295 230 M135 245A10 10 0 1 0 134 245 M225 245A10 10 0 1 0 224 245 M165 285Q180 300 195 285 M180 300V320'],
  'animal-cat': ['M80 230 95 120 155 165Q180 145 205 165L265 120 280 230Q290 350 180 395Q70 350 80 230Z', 'M130 245A9 9 0 1 0 129 245 M230 245A9 9 0 1 0 229 245 M165 285 180 295 195 285 M180 295V315 M120 295 45 275M120 315 40 320M240 295 315 275M240 315 320 320'],
  'animal-bird': ['M80 275Q105 160 220 200Q285 215 275 300Q250 390 145 365Q75 345 80 275Z', 'M220 220 325 260 235 285 M120 220Q75 125 155 155 M115 290Q170 230 225 310 M135 365 115 430M185 375 205 430'],
  'animal-fish': ['M45 275Q130 165 255 235L330 175 315 285 330 385 255 325Q130 385 45 275Z', 'M100 255A9 9 0 1 0 99 255 M125 320Q175 355 225 315 M210 210Q225 160 265 205'],
  'animal-butterfly': ['M180 165Q110 75 65 150Q20 240 145 280Q35 330 95 430Q150 465 180 315', 'M180 165Q250 75 295 150Q340 240 215 280Q325 330 265 430Q210 465 180 315 M180 165V395 M165 150Q140 105 125 115M195 150Q220 105 235 115'],
  'animal-rabbit': ['M125 205Q80 45 145 65L180 190 M235 205Q280 45 215 65L180 190', 'M85 265Q85 180 180 180Q275 180 275 265Q275 390 180 420Q85 390 85 265Z M135 265A9 9 0 1 0 134 265 M225 265A9 9 0 1 0 224 265 M165 305 180 315 195 305'],
  'animal-turtle': ['M70 285Q85 165 220 180Q300 195 295 295Q285 380 165 385Q65 370 70 285Z', 'M285 230Q345 220 330 285Q315 315 285 300 M105 365 75 420M155 380 145 440M225 370 250 430 M115 210 245 350M245 210 115 350'],
  'animal-horse': ['M95 220Q85 130 155 115Q245 110 265 205L245 340Q220 405 155 385Q95 355 95 220Z', 'M105 165 65 105 75 220 M230 145 285 95 270 220 M140 245A9 9 0 1 0 139 245 M220 245A9 9 0 1 0 219 245 M145 315Q180 340 215 315 M155 385V455M220 380V455'],
  'animal-cow': ['M80 220Q85 130 180 135Q275 130 280 220V330Q260 410 180 420Q100 410 80 330Z', 'M95 175 45 105 65 235 M265 175 315 105 295 235 M125 245A9 9 0 1 0 124 245 M235 245A9 9 0 1 0 234 245 M125 315Q180 280 235 315V370Q180 405 125 370Z'],
  'animal-chicken': ['M95 300Q85 175 190 165Q285 180 275 300Q255 400 155 395Q90 370 95 300Z', 'M190 165Q185 105 225 115Q255 125 245 180 M240 205 320 245 250 275 M140 395 125 455M205 395 220 455 M125 455H95M220 455H250'],

  'transport-bus': ['M35 175H325V370H35Z M65 205H125V280H65Z M145 205H205V280H145Z M225 205H295V280H225Z', 'M45 320H315 M85 380A35 35 0 1 0 84 380 M275 380A35 35 0 1 0 274 380'],
  'transport-car': ['M45 300 85 220H260L315 300V380H45Z M105 220 135 165H225L260 220', 'M100 380A35 35 0 1 0 99 380 M260 380A35 35 0 1 0 259 380 M120 260H240'],
  'transport-bike': ['M95 345A65 65 0 1 0 94 345 M265 345A65 65 0 1 0 264 345', 'M95 345 155 235 215 345 265 345 210 245 155 235 M135 210H190 M205 205 210 245'],
  'transport-motorcycle': ['M85 350A55 55 0 1 0 84 350 M275 350A55 55 0 1 0 274 350', 'M85 350 145 275 230 275 275 350 M145 275 125 225H190 M230 275 255 220H295'],
  'transport-truck': ['M30 225H220V370H30Z M220 270H285L330 320V370H220Z M245 285H280L305 320H245Z', 'M85 385A35 35 0 1 0 84 385 M270 385A35 35 0 1 0 269 385'],
  'transport-boat': ['M40 315H320L275 405H95Z M180 105V315 M180 125 285 270H180Z M180 150 90 270H180Z', 'M20 435Q70 405 120 435T220 435T340 435'],
  'transport-plane': ['M35 280 145 245 175 105H210L205 240 325 210 340 245 215 295 235 405 205 420 175 315 55 330Z'],
  'transport-train': ['M45 180H285V355H45Z M285 245H325V355H285 M75 210H135V275H75Z M160 210H220V275H160Z', 'M95 375A35 35 0 1 0 94 375 M245 375A35 35 0 1 0 244 375 M25 430H340'],
  'transport-tractor': ['M35 305H215V380H35Z M125 205H215V305H125Z M215 275H275L310 330V380H215Z', 'M95 385A55 55 0 1 0 94 385 M270 390A38 38 0 1 0 269 390'],
  'transport-ambulance': ['M35 225H235V370H35Z M235 270H300L330 315V370H235Z M120 250V315M88 282H152', 'M90 385A32 32 0 1 0 89 385 M275 385A32 32 0 1 0 274 385'],

  'daily-school': ['M45 220 180 120 315 220V430H45Z M145 430V330H215V430', 'M85 255H135V305H85Z M225 255H275V305H225Z M180 165V215M155 190H205 M20 430H340'],
  'daily-backpack': ['M85 205Q90 120 180 120Q270 120 275 205V420H85Z M125 120Q125 65 180 65Q235 65 235 120', 'M110 265H250V365H110Z M85 230 45 300V405M275 230 315 300V405'],
  'daily-book': ['M40 155Q110 125 180 185V410Q110 350 40 380Z M320 155Q250 125 180 185V410Q250 350 320 380Z', 'M75 205Q125 190 160 220M75 255Q125 240 160 270M285 205Q235 190 200 220M285 255Q235 240 200 270'],
  'daily-ball': ['M180 115A145 145 0 1 0 179 115 M180 115 220 205 315 210 245 280 270 390 180 330 90 390 115 280 45 210 140 205Z'],
  'daily-kite': ['M180 75 300 215 180 355 60 215Z M180 75V355M60 215H300', 'M180 355Q130 395 190 425Q235 450 180 485 M155 390 125 375M200 430 230 410'],
  'daily-umbrella': ['M45 250Q70 110 180 110Q290 110 315 250Q270 205 225 250Q180 205 135 250Q90 205 45 250Z', 'M180 110V410Q180 455 225 430'],
  'daily-cup': ['M75 190H255V390Q250 440 165 440Q80 440 75 390Z M255 240Q335 235 325 315Q315 370 255 355', 'M105 145Q90 105 120 75M165 145Q150 105 180 75M225 145Q210 105 240 75'],
  'daily-fruit': ['M55 300Q180 245 305 300L275 430H85Z M55 300Q180 380 305 300', 'M105 260A38 38 0 1 0 104 260 M180 235A42 42 0 1 0 179 235 M250 265A36 36 0 1 0 249 265 M180 190Q200 145 235 155'],
  'daily-guitar': ['M205 90 255 110 205 310Q265 340 235 415Q210 465 155 435Q100 405 125 350Q145 310 175 315Z', 'M205 90 175 315M220 105 190 325 M160 365A25 25 0 1 0 159 365'],
  'daily-playground': ['M45 400 125 205 205 400 M80 310H170 M105 310V390M145 310V390', 'M220 185H315V235H220Z M265 235V400 M220 400Q265 330 310 400 M30 430H335'],

  'land-mountain': ['M20 415 115 210 170 310 235 125 340 415Z M85 275 115 210 145 265 M200 190 235 125 270 205', 'M70 105A35 35 0 1 0 69 105 M20 415H340'],
  'land-beach': ['M20 355Q90 320 160 355T300 355T340 350 M20 420Q85 390 150 420T280 420T340 415', 'M245 110A45 45 0 1 0 244 110 M85 340V190M85 190Q35 210 35 270M85 190Q135 210 135 270'],
  'land-river': ['M20 115Q110 165 70 245Q35 325 115 420 M340 115Q250 165 290 245Q325 325 245 420', 'M95 145 160 85 220 150 285 75 340 135 M20 440H340'],
  'land-forest': ['M55 420V260L15 260 75 170 35 170 95 70 155 170 115 170 175 260 135 260V420', 'M225 420V285H185L245 205H210L270 105 330 205H295L345 285H305V420 M15 430H345'],
  'land-farm': ['M25 420V270L105 205 185 270V420 M70 420V330H140V420 M220 420V250L275 195 330 250V420', 'M185 420Q220 350 255 420M25 445H340 M270 110A35 35 0 1 0 269 110'],
  'land-village': ['M20 420V285L80 230 140 285V420 M115 420V245L185 180 255 245V420 M230 420V300L290 250 340 300V420', 'M45 320H80V355H45Z M160 275H205V320H160Z M270 330H305V365H270Z'],
  'land-rainbow': ['M35 390A145 145 0 0 1 325 390 M70 390A110 110 0 0 1 290 390 M105 390A75 75 0 0 1 255 390', 'M40 390Q15 350 55 330Q80 295 110 340 M250 340Q280 295 305 330Q345 350 320 390'],
  'land-night': ['M250 75Q185 125 235 190Q285 230 325 180Q280 275 195 230Q125 180 165 110Q195 75 250 75Z', 'M75 95 85 120 112 122 92 140 98 168 75 153 52 168 58 140 38 122 65 120Z M35 420 105 300 165 380 235 250 335 420Z'],
  'land-waterfall': ['M30 150 115 80 175 145 245 75 330 150 M125 140V300Q125 380 80 440 M235 135V300Q235 380 280 440', 'M125 300Q180 330 235 300 M80 440Q180 390 280 440 M25 455H335'],
  'land-sunfield': ['M275 95A45 45 0 1 0 274 95 M275 30V5M275 185V210M210 95H180M340 95H360M230 50 210 30M320 50 340 30', 'M20 420Q100 360 180 420T340 420 M90 410V280M65 315Q90 250 115 315M55 350Q90 285 125 350 M235 415V305M210 340Q235 275 260 340'],
};

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

  const visibleTemplates = templateCategory === 'Todas'
    ? DRAWING_TEMPLATES
    : DRAWING_TEMPLATES.filter((item) => item.category === templateCategory);

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
      setGuideVisible(false);
      // La guía es solo visual. Esperamos a que desaparezca antes de capturar.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      await saveDrawingPath(letterId, uri, description);
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ChildBackground />
      {/* 🛠️ TOP TOOLBAR */}
      <View style={[styles.toolbar, { paddingTop: Math.max(insets.top + 8, 12) }]}>
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
                
                {/* 1. White background and saved image */}
                <View style={[StyleSheet.absoluteFill, styles.whiteCanvas]} />
                {existingImage ? (
                    <Image 
                        source={{ uri: existingImage }} 
                        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', resizeMode: 'contain' }]} 
                    />
                ) : null}

                {/* 2. Offline dotted guide (hidden automatically while saving) */}
                {guideVisible && template && !existingImage && (
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
      <View style={[
        styles.bottomBar,
        { paddingBottom: Math.max(insets.bottom + 10, 14) },
      ]}>
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
                <Text style={styles.modalTitle}>50 guías para dibujar</Text>
                <Text style={styles.modalSubtitle}>Punteadas, offline y no aparecen en el dibujo guardado</Text>
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
              <Text style={styles.randomTemplateText}>Generar una guía al azar</Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {TEMPLATE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setTemplateCategory(category)}
                  style={[
                    styles.categoryChip,
                    templateCategory === category && styles.activeCategoryChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      templateCategory === category && styles.activeCategoryChipText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.templateGrid}>
              {visibleTemplates.map((item) => (
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
  whiteCanvas: { backgroundColor: '#fff' },
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
  categoryList: { paddingBottom: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#f2f4f7', borderWidth: 1, borderColor: '#e4e7ec'
  },
  activeCategoryChip: { backgroundColor: '#ede9fe', borderColor: '#8b5cf6' },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: '#475467' },
  activeCategoryChipText: { color: '#6d28d9' },
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
