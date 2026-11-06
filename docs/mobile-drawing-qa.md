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

## Verificación física pendiente

Usar un teléfono y una tablet Android, con copias de cartas de prueba:

1. Dibujar líneas rápidas, curvas, puntos y figuras junto a los cuatro bordes; comprobar que el dedo y el trazo coincidan. Probar Directo, Normal y Suave.
2. Dibujar en café, tonos de piel y marcador; probar contorno/relleno, deshacer y rehacer. Abrir plantillas, filtrar Navidad y cambiar de guía.
3. Guardar con el teclado visible y descripción larga. Reabrir: el dibujo y la descripción deben estar en consulta. Pulsar «Editar dibujo», modificar y guardar; reabrir y confirmar todos los cambios.
4. Preparar para envío sin señal. Volver a abrir el dibujo: no debe mostrar «Editar dibujo» ni permitir guardar por una ruta directa. Una carta devuelta para corrección debe permitir edición explícita.
5. Abrir una carta que ya tenía PNG antes de actualizar y comprobar que siga visible. Editarla sin limpiar para comprobar que conserve el dibujo original.
6. Desde «Preguntas y mensaje», consultar y responder las preguntas obligatorias, continuar y redactar. Volver a preguntas sin perder el texto; guardar y comprobar respuestas y mensaje. No debe existir una tarea independiente de preguntas.
7. Probar cierre/reapertura de la aplicación y sincronización. La representación administrativa se revisará en la siguiente etapa.

Para generar el APK instalable se requiere la cuenta Expo/EAS autorizada del proyecto: `npm run build:apk`. La exportación de Metro comprueba el bundle Android; no reemplaza estas pruebas de pantalla táctil ni genera un APK.
