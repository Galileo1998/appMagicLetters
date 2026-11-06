export type TemplateCategory = 'Hogar' | 'Animales' | 'Transporte' | 'Cotidiano' | 'Paisajes' | 'Navidad' | 'Naturaleza' | 'Creatividad';
type TemplateId = string;

type DrawingTemplate = {
  id: TemplateId;
  name: string;
  emoji: string;
  category: TemplateCategory;
};

export const DRAWING_TEMPLATES: DrawingTemplate[] = [
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

export const TEMPLATE_CATEGORIES: (TemplateCategory | 'Todas')[] = [
  'Todas',
  'Hogar',
  'Animales',
  'Transporte',
  'Cotidiano',
  'Paisajes', 'Navidad', 'Naturaleza', 'Creatividad',
];

export const templateStroke = {
  fill: "none",
  stroke: "#475467",
  strokeWidth: 2.5,
  
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const GUIDE_PATHS: Record<TemplateId, string[]> = {
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


// Contornos y escenarios combinados: 30 temas × 5 composiciones, además de las 50 guías iniciales.
const SUBJECTS = [
  {
    "id": "xmas-tree",
    "name": "Árbol decorado",
    "category": "Navidad",
    "paths": [
      "M180 90 250 200H220L280 285H240L305 375H55L120 285H80L140 200H110ZM160 375V420H200V375",
      "M180 55 190 75 215 75 195 90 202 112 180 99 158 112 165 90 145 75 170 75Z",
      "M130 230Q180 270 230 230M105 315Q180 360 255 315M160 185a8 8 0 1 0 16 0a8 8 0 1 0-16 0M195 280a9 9 0 1 0 18 0a9 9 0 1 0-18 0"
    ]
  },
  {
    "id": "xmas-gift",
    "name": "Regalos con lazo",
    "category": "Navidad",
    "paths": [
      "M75 240H285V410H75ZM65 210H295V250H65ZM165 210V410H195V210",
      "M180 210C80 205 95 120 150 150Q180 170 180 210C280 205 265 120 210 150Q180 170 180 210",
      "M90 300H140M220 300H270M90 360H140M220 360H270"
    ]
  },
  {
    "id": "xmas-bells",
    "name": "Campanas y acebo",
    "category": "Navidad",
    "paths": [
      "M80 330Q110 290 105 235Q100 175 150 175Q200 175 195 235Q190 290 220 330ZM70 330Q145 360 230 330M135 350Q150 380 165 350",
      "M180 300Q210 270 210 220Q210 170 250 170Q290 170 290 220Q285 260 315 300ZM175 300Q250 330 320 300",
      "M150 170Q150 100 200 145Q250 100 250 165M175 140 145 105 140 150ZM225 140 265 105 270 150Z"
    ]
  },
  {
    "id": "xmas-stocking",
    "name": "Bota de regalos",
    "category": "Navidad",
    "paths": [
      "M125 150H245V315Q310 300 310 355Q310 415 245 415H135Q95 415 95 365Q95 330 125 310ZM110 130H260V180H110Z",
      "M150 200H225M150 235H225M155 310 170 340 205 340 180 360 190 390 160 372 135 390 145 360 120 340 150 340Z"
    ]
  },
  {
    "id": "xmas-wreath",
    "name": "Corona navideña",
    "category": "Navidad",
    "paths": [
      "M180 135a120 120 0 1 0 0 240a120 120 0 1 0 0-240M180 185a70 70 0 1 0 0 140a70 70 0 1 0 0-140",
      "M180 360Q100 315 100 370Q105 410 180 380Q255 410 260 370Q260 315 180 360ZM165 380 145 430 180 410 210 430 195 380",
      "M80 230 110 215M95 175 125 190M245 180 270 165M255 230 285 245"
    ]
  },
  {
    "id": "xmas-candle",
    "name": "Vela de paz",
    "category": "Navidad",
    "paths": [
      "M125 235H235V410H125ZM125 235Q150 260 160 235Q175 285 185 235Q210 260 235 235",
      "M180 115Q115 185 180 220Q245 185 180 115ZM180 175Q155 205 180 215Q205 205 180 175",
      "M75 410H285V430H75ZM165 290H195M165 330H195"
    ]
  },
  {
    "id": "xmas-card",
    "name": "Tarjeta de buenos deseos",
    "category": "Navidad",
    "paths": [
      "M70 155H290V415H70ZM85 170H275V400H85Z",
      "M180 210 195 245 230 245 202 265 212 300 180 278 148 300 158 265 130 245 165 245Z",
      "M110 330H250M110 350H250M130 370H230"
    ]
  },
  {
    "id": "xmas-gingerbread",
    "name": "Galleta decorada",
    "category": "Navidad",
    "paths": [
      "M135 210C70 205 50 245 100 270L135 260 115 365Q105 420 140 415L180 355 220 415Q255 420 245 365L225 260 260 270C310 245 290 205 225 210C265 125 95 125 135 210Z",
      "M150 185h5M205 185h5M155 210Q180 235 205 210M172 270a8 8 0 1 0 16 0a8 8 0 1 0-16 0M172 310a8 8 0 1 0 16 0a8 8 0 1 0-16 0",
      "M105 242 125 235M235 235 255 242M135 375 150 350M210 350 225 375"
    ]
  },
  {
    "id": "xmas-lantern",
    "name": "Farol de Navidad",
    "category": "Navidad",
    "paths": [
      "M115 220H245L230 390H130ZM100 205H260L230 165H130ZM125 390H235V410H125Z",
      "M145 165V145Q180 95 215 145V165M145 225V380M215 225V380",
      "M165 285H195V370H165ZM180 245Q150 275 180 285Q210 275 180 245"
    ]
  },
  {
    "id": "xmas-ornament",
    "name": "Esferas decoradas",
    "category": "Navidad",
    "paths": [
      "M180 205a95 95 0 1 0 0 190a95 95 0 1 0 0-190M155 180H205V210H155ZM180 100V180",
      "M95 260Q180 310 265 260M95 335Q180 285 265 335",
      "M150 240h10M210 240h10M130 345h10M220 345h10"
    ]
  },
  {
    "id": "nature-flower",
    "name": "Girasol",
    "category": "Naturaleza",
    "paths": [
      "M180 220a38 38 0 1 0 0 76a38 38 0 1 0 0-76M180 220Q140 110 180 120Q220 110 180 220M215 235Q310 160 300 210Q310 250 215 260M210 285Q300 340 255 355Q220 365 190 295M150 285Q60 340 100 355Q135 370 170 295M145 235Q50 160 60 210Q50 255 145 260",
      "M180 295V425M180 370Q110 300 105 350Q110 390 180 385M180 350Q250 290 255 335Q250 370 180 365"
    ]
  },
  {
    "id": "nature-leaf",
    "name": "Hojas y nervaduras",
    "category": "Naturaleza",
    "paths": [
      "M180 385Q65 360 75 250Q85 145 270 125Q290 310 180 385Z",
      "M115 340 245 155M150 300 110 240M175 270 155 195M200 235 210 160M150 300 225 310M175 270 260 255M200 235 270 210",
      "M180 385 160 425"
    ]
  },
  {
    "id": "nature-snail",
    "name": "Caracol en el jardín",
    "category": "Naturaleza",
    "paths": [
      "M165 230a75 75 0 1 0 0 150a75 75 0 1 0 0-150M165 250a50 50 0 1 1-40 70Q115 280 160 280Q195 280 185 320",
      "M85 355Q45 395 100 410H265Q320 410 310 365L300 310Q280 285 260 315L250 365",
      "M270 320 260 275M290 315 310 275M252 267a8 8 0 1 0 16 0a8 8 0 1 0-16 0M302 267a8 8 0 1 0 16 0a8 8 0 1 0-16 0"
    ]
  },
  {
    "id": "nature-ladybug",
    "name": "Mariquita",
    "category": "Naturaleza",
    "paths": [
      "M180 185a105 105 0 1 0 0 210a105 105 0 1 0 0-210M180 185V395M140 185Q130 135 180 135Q230 135 220 185",
      "M150 150 125 115M210 150 235 115M90 250 55 235M80 300H45M100 355 65 375M270 250 305 235M280 300H315M260 355 295 375",
      "M120 245a16 16 0 1 0 32 0a16 16 0 1 0-32 0M210 245a16 16 0 1 0 32 0a16 16 0 1 0-32 0M115 325a18 18 0 1 0 36 0a18 18 0 1 0-36 0M210 325a18 18 0 1 0 36 0a18 18 0 1 0-36 0"
    ]
  },
  {
    "id": "nature-owl",
    "name": "Búho en una rama",
    "category": "Naturaleza",
    "paths": [
      "M90 230 100 130 150 175Q180 155 210 175L260 130 270 230Q290 370 180 390Q70 370 90 230Z",
      "M130 205a35 35 0 1 0 0 70a35 35 0 1 0 0-70M230 205a35 35 0 1 0 0 70a35 35 0 1 0 0-70M165 275 180 300 195 275ZM110 295Q140 355 165 350M250 295Q220 355 195 350",
      "M45 410H315M145 380V420M215 380V420"
    ]
  },
  {
    "id": "nature-bee",
    "name": "Abeja y miel",
    "category": "Naturaleza",
    "paths": [
      "M95 285Q95 220 180 220Q265 220 265 285Q265 350 180 350Q95 350 95 285ZM140 230V340M180 220V350M220 230V340",
      "M165 225Q70 100 100 95Q165 80 180 220Q195 80 260 95Q290 100 195 225M100 275 70 250M260 275 290 250",
      "M260 265h5M270 290Q280 305 290 290"
    ]
  },
  {
    "id": "nature-dolphin",
    "name": "Delfín saltando",
    "category": "Naturaleza",
    "paths": [
      "M60 300Q110 155 220 190L260 130 250 210Q280 230 290 280L325 300 280 315Q260 280 225 275L200 335 170 280Q110 270 60 300Z",
      "M235 235h5M250 255Q265 270 280 265M70 385Q110 355 150 385T230 385T310 385M60 415Q105 390 150 415T240 415T320 415"
    ]
  },
  {
    "id": "nature-fox",
    "name": "Zorrito",
    "category": "Naturaleza",
    "paths": [
      "M85 250 80 125 155 190Q180 175 205 190L280 125 275 250Q265 360 180 395Q95 360 85 250Z",
      "M95 250Q150 230 180 345Q210 230 265 250M145 260h5M210 260h5M165 340 180 355 195 340ZM110 190 100 160 135 195M225 195 260 160 250 190"
    ]
  },
  {
    "id": "nature-pineapple",
    "name": "Piña tropical",
    "category": "Naturaleza",
    "paths": [
      "M180 205Q90 190 90 310Q90 420 180 425Q270 420 270 310Q270 190 180 205Z",
      "M180 205 125 115 170 145 180 80 200 145 245 115 210 210",
      "M110 245 240 375M140 215 260 335M100 295 210 410M250 245 120 375M220 215 100 335M260 295 150 410"
    ]
  },
  {
    "id": "nature-mushroom",
    "name": "Hongos del bosque",
    "category": "Naturaleza",
    "paths": [
      "M70 275Q80 120 180 130Q280 120 290 275ZM155 275 140 410H220L205 275Z",
      "M115 205a18 18 0 1 0 36 0a18 18 0 1 0-36 0M200 215a22 22 0 1 0 44 0a22 22 0 1 0-44 0M165 160a12 12 0 1 0 24 0a12 12 0 1 0-24 0",
      "M155 355H205M155 375H205"
    ]
  },
  {
    "id": "create-rocket",
    "name": "Cohete espacial",
    "category": "Creatividad",
    "paths": [
      "M180 110Q100 180 130 335H230Q260 180 180 110ZM145 335 100 390V290ZM215 335 260 390V290Z",
      "M180 185a30 30 0 1 0 0 60a30 30 0 1 0 0-60M155 335Q150 395 180 425Q210 395 205 335M165 345 180 390 195 345"
    ]
  },
  {
    "id": "create-castle",
    "name": "Castillo",
    "category": "Creatividad",
    "paths": [
      "M70 225H130V410H70ZM230 225H290V410H230ZM130 280H230V410H130ZM60 225 100 150 140 225ZM220 225 260 150 300 225Z",
      "M160 410V350Q180 315 200 350V410M90 260H110V300H90ZM250 260H270V300H250ZM145 280V255H160V280M200 280V255H215V280"
    ]
  },
  {
    "id": "create-robot",
    "name": "Robot amistoso",
    "category": "Creatividad",
    "paths": [
      "M105 150H255V260H105ZM95 285H265V385H95ZM125 385V425H155V385M205 385V425H235V385M95 305H65V365H95M265 305H295V365H265",
      "M180 150V120M172 105a8 8 0 1 0 16 0a8 8 0 1 0-16 0M130 185H155V210H130ZM205 185H230V210H205ZM145 235H215M135 320H225V350H135Z"
    ]
  },
  {
    "id": "create-music",
    "name": "Notas musicales",
    "category": "Creatividad",
    "paths": [
      "M115 345V175L260 140V310M115 205 260 170",
      "M115 345C70 315 45 370 80 390Q120 400 115 345M260 310C215 280 190 335 225 355Q265 365 260 310",
      "M80 240 95 230M280 225 300 210M180 365V410M165 395H195"
    ]
  },
  {
    "id": "create-crown",
    "name": "Corona de amistad",
    "category": "Creatividad",
    "paths": [
      "M75 245 65 150 130 200 180 120 230 200 295 150 285 245ZM75 245H285V295H75Z",
      "M110 265a8 8 0 1 0 16 0a8 8 0 1 0-16 0M172 265a8 8 0 1 0 16 0a8 8 0 1 0-16 0M235 265a8 8 0 1 0 16 0a8 8 0 1 0-16 0",
      "M105 350Q140 315 180 350Q220 315 255 350Q250 390 180 425Q110 390 105 350Z"
    ]
  },
  {
    "id": "create-telescope",
    "name": "Telescopio",
    "category": "Creatividad",
    "paths": [
      "M85 205 265 140 290 210 110 275ZM70 210 85 205 110 275 95 280ZM255 140 270 135 295 205 280 210Z",
      "M180 250V305M180 305 110 425M180 305 250 425M180 305V425",
      "M125 375H235"
    ]
  },
  {
    "id": "create-palette",
    "name": "Paleta de artista",
    "category": "Creatividad",
    "paths": [
      "M180 150Q70 145 65 265Q65 370 160 385Q220 380 200 335Q180 295 250 305Q320 310 300 230Q280 155 180 150Z",
      "M110 220a15 15 0 1 0 30 0a15 15 0 1 0-30 0M165 185a15 15 0 1 0 30 0a15 15 0 1 0-30 0M230 205a15 15 0 1 0 30 0a15 15 0 1 0-30 0M100 295a15 15 0 1 0 30 0a15 15 0 1 0-30 0",
      "M240 345 280 415 300 400 255 335ZM240 345Q205 320 220 305Q245 295 255 335Z"
    ]
  },
  {
    "id": "create-hotair",
    "name": "Globo aerostático",
    "category": "Creatividad",
    "paths": [
      "M180 120C40 115 45 235 125 315H235C315 235 320 115 180 120ZM125 315 145 365M235 315 215 365M135 365H225L215 420H145Z",
      "M180 120Q115 210 145 315M180 120Q245 210 215 315M180 120V315M90 220H270",
      "M150 385H210"
    ]
  },
  {
    "id": "create-drum",
    "name": "Tambor festivo",
    "category": "Creatividad",
    "paths": [
      "M80 235Q180 190 280 235V360Q180 405 80 360ZM80 235Q180 280 280 235M80 360Q180 315 280 360",
      "M90 250 130 365 180 265 230 365 270 250M105 140 220 210M250 140 140 210",
      "M90 130a10 10 0 1 0 20 0a10 10 0 1 0-20 0M240 130a10 10 0 1 0 20 0a10 10 0 1 0-20 0"
    ]
  },
  {
    "id": "create-heart",
    "name": "Corazón para compartir",
    "category": "Creatividad",
    "paths": [
      "M180 350C30 265 70 145 145 180L180 215 215 180C290 145 330 265 180 350Z",
      "M140 230a6 6 0 1 0 12 0a6 6 0 1 0-12 0M208 230a6 6 0 1 0 12 0a6 6 0 1 0-12 0M145 275Q180 310 215 275",
      "M115 365 80 400 115 425M245 365 280 400 245 425M80 400H150M210 400H280"
    ]
  }
];
const SCENES = [
  {
    "id": "detalle",
    "name": "Detalle y motivos",
    "path": "M35 85V55H65M295 55H325V85M35 435V465H65M295 465H325V435"
  },
  {
    "id": "jardin",
    "name": "En el jardín",
    "path": "M20 455Q90 425 160 455T340 455M40 445V395M25 410Q40 380 55 410M320 445V395M305 410Q320 380 335 410M40 65Q65 35 90 65Q115 35 140 65"
  },
  {
    "id": "fiesta",
    "name": "Día de fiesta",
    "path": "M30 65Q180 115 330 65M50 75 60 110 80 85M120 93 140 125 155 98M210 98 230 125 245 93M280 85 300 110 310 75M35 425 45 415M310 435 325 420M50 370 35 355"
  },
  {
    "id": "estrellas",
    "name": "Bajo las estrellas",
    "path": "M45 100 52 120 74 120 57 133 64 153 45 140 26 153 33 133 16 120 38 120ZM305 100 312 120 334 120 317 133 324 153 305 140 286 153 293 133 276 120 298 120ZM40 460H320M130 65H230"
  },
  {
    "id": "paisaje",
    "name": "Con montañas y nubes",
    "path": "M25 125 60 85 95 125M270 125 305 85 340 125M20 465 70 440 120 465 175 435 230 465 285 440 340 465M125 65Q135 35 155 50Q180 20 200 50Q225 40 235 65Z"
  }
];
for (const subject of SUBJECTS) {
  for (const scene of SCENES) {
    const id = `${subject.id}-${scene.id}`;
    DRAWING_TEMPLATES.push({ id, name: `${subject.name} · ${scene.name}`,
      emoji: subject.category === 'Navidad' ? '🎄' : '🎨', category: subject.category as TemplateCategory });
    GUIDE_PATHS[id] = [...subject.paths, scene.path];
  }
}
