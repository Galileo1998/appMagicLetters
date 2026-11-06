# Dibujo y mensaje móvil

Validación automática:

```sh
npm ci
node --test tests/mobile-workflow.test.cjs
npx tsc --noEmit
npm run lint
npx expo export --platform android
```

La migración agrega `local_drawings.editor_state` sin borrar dibujos ni descripciones existentes. Los nuevos dibujos conservan sus trazos y la plantilla localmente para deshacer y editar. Los PNG antiguos se mantienen como fondo: sus trazos originales no se pueden separar. La sincronización mantiene PNG, descripción, mensaje y respuestas con el formato previo.

## Adaptación de pantalla (1.2.3)

Las categorías se distribuyen en filas y comparten el desplazamiento vertical de las plantillas. La cuadrícula calcula sus columnas con el ancho real del selector y el tamaño de letra; las tarjetas y sus nombres crecen sin una altura fija. El lienzo mantiene la proporción 360 × 520 y los controles respetan los márgenes del sistema. En pantallas bajas o con letra grande, «Mostrar herramientas» permite abrir colores y grosor sin ocupar permanentemente el espacio para dibujar.

Se verificó la interfaz real con React Native Web y datos de prueba, en ocho tamaños simulados con anchos de 320 a 1024 puntos y alturas de 480 a 1024 puntos: nueve categorías completas, selección de Navidad, letra al 180 % y 200 %, márgenes inferiores de 24 y 48 puntos y márgenes laterales. Se probaron trazos con ratón en teléfono y tablet y el cambio de tamaño con el selector abierto, sin errores. Esta prueba no ejecuta Android nativo ni sustituye la comprobación táctil del APK.

## Verificación física pendiente

Usar un teléfono y una tablet Android, con copias de cartas de prueba:

1. Dibujar líneas rápidas, curvas, puntos y figuras junto a los cuatro bordes; comprobar que el dedo y el trazo coincidan. Probar Directo, Normal y Suave.
2. Abrir plantillas en teléfonos de 320 y 360 puntos de ancho, tablets de 600, 768 y 1024, ventana dividida y letra ampliada. Las nueve categorías deben distribuirse en filas, mostrar el nombre completo y permitir selección. El encabezado y cierre deben quedar dentro de la pantalla, y la lista debe desplazarse hasta la última plantilla incluso en pantallas bajas. Cambiar el tamaño de la ventana con el selector abierto; la cuadrícula debe ajustar sus columnas sin errores. Dibujar en café, tonos de piel y marcador; probar contorno/relleno, deshacer y rehacer. Abrir plantillas, filtrar Navidad y cambiar de guía.
3. Guardar con el teclado visible y descripción larga. Reabrir: el dibujo y la descripción deben estar en consulta. Pulsar «Editar dibujo», modificar y guardar; reabrir y confirmar todos los cambios.
4. Preparar para envío sin señal. Volver a abrir el dibujo: no debe mostrar «Editar dibujo» ni permitir guardar por una ruta directa. Una carta devuelta para corrección debe permitir edición explícita.
5. Abrir una carta que ya tenía PNG antes de actualizar y comprobar que siga visible. Editarla sin limpiar para comprobar que conserve el dibujo original.
6. Desde «Preguntas y mensaje», seleccionar una pregunta: debe pasar directamente a redacción, con la pregunta arriba del cuadro. No debe solicitar una respuesta separada. Redactar el mensaje completo. Cambiar de pregunta sin perder el texto; guardar, reabrir y comprobar la selección y el mensaje. Verificar que se habilite el envío aunque otras preguntas del catálogo sean obligatorias. No debe existir una tarea independiente de preguntas.
7. Probar cierre/reapertura de la aplicación y sincronización. Comprobar que el panel y PDF muestren CONTENIDO → pregunta seleccionada → texto completo para los nuevos envíos V2. La integración ya está instalada; el histórico conserva V1.
8. En Android, alternar navegación por gestos y tres botones. Colores, descripción y lienzo deben quedar sobre la barra del sistema. Probar «Mostrar/Ocultar herramientas», abrir el teclado, escribir y guardar: el PNG debe conservar los cuatro bordes. El botón Atrás de Android debe cerrar primero el selector de plantillas.

Para generar el APK instalable se requiere la cuenta Expo/EAS autorizada del proyecto: `npm run build:apk`. La exportación de Metro comprueba el bundle Android; no reemplaza estas pruebas de pantalla táctil ni genera un APK.

## Compilar la versión correcta (1.2.3 · KidiConnect)

Los cambios del editor y del flujo de preguntas deben estar integrados en `main`. En una copia git limpia del repositorio `Galileo1998/appMagicLetters`:

```sh
git switch main
git pull --ff-only origin main
node -p "require('./app.json').expo.version"
npm ci
npm run build:apk -- --clear-cache
```

La versión debe imprimir `1.2.3`. Si se compila desde Expo conectado a GitHub, seleccionar `main` con los cambios de KidiConnect y el perfil `apk`. No reutilizar una carpeta ZIP ni un build anterior. El perfil APK incrementa automáticamente el código Android con la fuente remota existente, conservando el proyecto EAS y la identificación del paquete. Las mismas credenciales de firma de EAS permiten actualizar la app instalada conservando sus datos. No desinstalar una app con borradores sin enviar.

Confirmar en el detalle del nuevo build el commit fuente y versión 1.2.3. El lanzador debe mostrar el nombre KidiConnect y la imagen enviada como icono, sin recortar el nombre al usar un icono circular. La pantalla de inicio de sesión conserva el logo de Acción Honduras. Al abrirlo deben verse las 200 plantillas y Preguntas y mensaje como una única tarea.

La versión 1.2.1 agrega `letter_answers.answer_in_message` con valor inicial 0, sin modificar respuestas previas. Al guardar una carta editable se conserva exactamente una pregunta seleccionada y la respuesta íntegra en `message_content`. El indicador viaja en `answers`; el servidor requiere el ajuste de recepción que acepta una respuesta separada vacía únicamente con esa marca y presentación V2. No duplicar el mensaje dentro de `answer_text`.
