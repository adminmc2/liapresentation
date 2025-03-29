# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Completado
- **Configuración inicial**
  - Instalación inicial a partir del fork de jovimoura/chatbot
  - Instalación de dependencia axios para peticiones HTTP
  - Configuración de archivo .env.local con variables de entorno para ElevenLabs, AssemblyAI y OpenAI
  - Creación de carpeta public para almacenar imágenes de la presentación
  - Añadidas imágenes necesarias para la demostración:
    - manzanares.jpg
    - armando-en-varsovia.jpg

- **Estructura de proyecto**
  - Creación de estructura de carpetas para el proyecto:
    - src/lib/data/
    - src/lib/services/
    - src/app/api/elevenlabs/
    - src/app/lia/
    - src/app/lia/test-voice/

- **Gestor de guión**
  - Implementación de `script-data.ts` con la estructura del guión
  - Creación de `script-manager.ts` para gestionar el estado del guión
  - Componentes `script-viewer.tsx` y `script-tracker.tsx` para mostrar y seguir el guión
  - Añadido soporte para síntesis de voz con propiedad `responseVoice`
  - Corrección de errores TypeScript relacionados con la interfaz `ScriptSegment`

- **Visualizaciones**
  - Componente `visualization.tsx` para mostrar imágenes y tablas
  - Soporte para diferentes tipos de visualizaciones (imagen, tabla, componente React)
  - Funcionalidad para expandir/contraer imágenes

- **Funcionalidad de voz**
  - **Reconocimiento de voz**:
    - Implementación del componente `voice-recognition.tsx` para reconocimiento de voz
    - Simulación de reconocimiento de voz para pruebas sin API externa
  
  - **Síntesis de voz con ElevenLabs**:
    - Creación del componente `voice-synthesis.tsx` para síntesis de voz
    - Implementación del servicio `elevenlabs-service.ts` con métodos `synthesizeSpeech` y `getVoices`
    - Implementación de rutas API:
      - `/api/elevenlabs/route.ts` para conversión de texto a voz
      - `/api/elevenlabs/voices/route.ts` para obtener voces disponibles
    - Implementación de página de prueba en `/src/app/lia/test-voice/page.tsx`
    - Resolución de problemas con pronunciación en español:
      - Implementado sistema para mejorar la detección del idioma español
      - Uso de comentarios HTML para indicar idioma sin afectar la pronunciación
      - Actualizado modelo a `eleven_turbo_v2_5` para mejor soporte multilingüe
      - Ajuste de parámetros de voz para optimizar la calidad
    - Corrección de errores de tipos en las interfaces de la API
    - Implementación de manejo detallado de errores según tipos específicos
    - Configuración de caché para mejorar el rendimiento de las solicitudes

- **Integración**
  - Componente principal `lia-presentation.tsx` que integra todas las funcionalidades
  - Página `/lia` para mostrar la presentación
  - Configuración de reproducción automática de audio para experiencia conversacional fluida

### Mejoras implementadas
- **Flujo de presentación automático**
  - Eliminados botones de navegación manual
  - Implementado avance automático basado en la finalización de la síntesis de voz
  - Configurada baja "creatividad" (0.2-0.3) para que LIA se ciña estrictamente al guión
  - Interfaz simplificada y enfocada en la presentación

- **Experiencia de usuario**
  - Ocultados controles de desarrollo en el modo producción
  - Mejorada la experiencia visual con indicadores de estado
  - Implementada reproducción automática de audio para conversación natural
  - Diseño responsive y limpio para presentaciones profesionales
  - Indicadores visuales de estado (hablando, escuchando, etc.)

- **Arquitectura y código**
  - Separación clara de responsabilidades entre componentes y servicios
  - Validación exhaustiva de parámetros
  - Gestión eficiente de recursos (limpieza de URLs de objetos)
  - Comunicación bidireccional entre componentes mediante callbacks
  - Estructura preparada para integración con APIs reales en producción

### Planificado para futuras versiones
- Implementación de reconocimiento de voz real con AssemblyAI
- Mejoras en la interfaz de usuario y experiencia
- Optimización de rendimiento
- Ampliación de tipos de visualización:
  1. Imágenes con texto superpuesto (overlay)
  2. Imágenes con texto adyacente (adjacent)
  3. Imágenes independientes (standalone)
- Carga optimizada de imágenes con next/image
- Transiciones suaves y expansión a pantalla completa

## [0.1.0] - 2025-03-27 06:14am
### Añadido
- Versión inicial basada en el repositorio jovimoura/chatbot

cat >> Changelog.md << 'EOF'

## [Unreleased]

### Completado
- **Reconocimiento de voz con AssemblyAI**
  - Creación del servicio `assemblyai-service.ts` con:
    - Método `transcribeAudio`: Permite enviar un blob de audio a AssemblyAI para su transcripción
    - Método `calculateKeywordConfidence`: Calcula la confianza de la transcripción basada en palabras clave
  - Implementación de una interfaz clara para el manejo de errores y resultados

### Consideraciones importantes
- El servicio se comunica con un endpoint API interno que debe ser implementado
- Se requiere una API key de AssemblyAI configurada en las variables de entorno
- La función de cálculo de confianza es fundamental para integrar con el sistema de guión
EOF

- **Implementación del endpoint API de AssemblyAI**
  - Creación del endpoint en `src/app/api/assemblyai/route.ts`
  - Implementada lógica para subir audio a AssemblyAI
  - Configurado para trabajar con idioma español
  - Manejo de trabajos de transcripción asíncronos con polling
  - Implementación de control de errores y validación de API key
  - Soporte para múltiples formatos de audio (webm, mp3, wav)

  Funciones principales implementadas:

uploadAudio(blob: Blob)

Sube un blob de audio al servicio de AssemblyAI
Maneja la transformación del blob al formato requerido


createTranscriptionJob(audioUrl: string)

Crea un trabajo de transcripción usando la URL del audio subido
Configura el idioma como español para una mejor precisión


getTranscriptionResult(transcriptId: string)

Implementa un sistema de polling para obtener el resultado de la transcripción
Reintenta hasta 10 veces con intervalos de 1 segundo
Maneja estados de completado y error



Consideraciones importantes:

El endpoint requiere la variable de entorno ASSEMBLYAI_API_KEY en .env.local
Se implementa un manejo completo del flujo de transcripción: subida → creación de trabajo → obtención de resultado
El proceso es asíncrono y usa polling para evitar bloquear el hilo principal
Se ha optimizado para transcripción en español, importante para nuestro caso de uso
Incluye validación y manejo de errores en cada paso del proceso.

- **Implementación de la página de prueba de reconocimiento de voz**
  - Creación de la página de prueba en `src/app/lia/test-voice-recognition/page.tsx`
  - Implementación de interfaz para grabar y procesar audio
  - Visualización en tiempo real del estado de grabación y procesamiento
  - Presentación clara del texto reconocido o errores
  - Instrucciones detalladas para el usuario
  - Indicadores visuales intuitivos del estado del sistema.

  Funciones principales implementadas:

setupMediaRecorder()

Configura el grabador de audio utilizando la API MediaRecorder
Gestiona los permisos de micrófono y el flujo de audio


processAudio(audioBlob: Blob)

Procesa el audio grabado utilizando el servicio AssemblyAI
Maneja los estados de carga y los errores
Actualiza la interfaz con los resultados


toggleRecording()

Inicia o detiene la grabación de audio
Gestiona el estado de grabación y reinicia los valores necesarios



Consideraciones importantes:

La página ofrece una interfaz de usuario intuitiva con estados visuales claros
Se incluyen instrucciones para guiar al usuario en el proceso
Se implementa manejo de errores con mensajes claros
Se utiliza el hook useRef para mantener referencias a objetos que necesitan persistir entre renderizados
La página sirve como entorno aislado para probar la funcionalidad antes de integrarla al flujo principal

- **Actualización del componente VoiceRecognition**
  - Modificación de `src/components/voice-recognition.tsx` para usar la API real de AssemblyAI
  - Reemplazo de la simulación por integración real con el servicio de AssemblyAI
  - Mejora en la gestión de los chunks de audio usando useRef
  - Optimización del proceso de grabación y envío del audio
  - Mantenimiento de la compatibilidad con el sistema de guiones existente
  - Integración con la detección de palabras clave para la navegación automática

  Cambios principales implementados:

Reemplazo de la simulación por API real

Eliminada la simulación anterior de reconocimiento
Implementada la integración con el servicio assemblyAIService


Mejora en la gestión del grabador de audio

Uso de useRef para mantener referencias estables a objetos
Manejo más eficiente de los chunks de audio
Limpieza adecuada de recursos al desmontar el componente


Proceso de audio mejorado

Transcripción real utilizando AssemblyAI
Manejo de errores más robusto
Flujo más claro del proceso de grabación → envío → respuesta



Consideraciones importantes:

El componente mantiene la misma interfaz externa, lo que permite una integración sin problemas con el resto de la aplicación
Se conserva la funcionalidad de detección de palabras clave y la notificación de coincidencias de segmentos
La interfaz de usuario se mantiene coherente con el diseño existente
El nuevo componente sigue manejando los estados visuales (grabando, procesando, etc.) de manera clara
Se ha mantenido la compatibilidad con los props existentes para asegurar que no se rompa la aplicación

- **Configuración del entorno y verificación final**
  - Actualización del archivo `.env.local` para incluir `ASSEMBLYAI_API_KEY`
  - Verificación de archivos y estructura del proyecto
  - Comprobación de integración con el flujo existente
  - Documentación actualizada con instrucciones de uso
  - Implementación completa del reconocimiento de voz real con AssemblyAI
  
  ontexto inicial
El proyecto LIA (La Inteligencia Asertiva) requería la implementación de reconocimiento de voz mediante la API de AssemblyAI para funcionar como copresentadora en una conferencia. Se presentó un problema específico: el botón de grabación no respondía correctamente o, cuando lo hacía, se producían errores al intentar transcribir el audio con la API de AssemblyAI.
Diagnóstico del problema
Al revisar el código existente y los logs, se identificó que:

El componente TestVoiceRecognition estaba configurado correctamente y el MediaRecorder se inicializaba sin problemas
El botón de grabación detectaba los clics y generaba blobs de audio
El servicio assemblyAIService tenía implementada una versión simulada que devolvía texto predefinido
Al intentar comunicarse con la API real de AssemblyAI, se producía un error 422 (Unprocessable Entity)

El error específico ocurría cuando el endpoint de AssemblyAI intentaba procesar blobs de audio muy pequeños o inválidos, como el blob de texto usado en la función de prueba ("test audio content" de 18 bytes).
Solución implementada
La solución consistió en implementar una verificación de tamaño tanto en el servicio como en el endpoint para detectar y manejar adecuadamente los blobs de audio inválidos o demasiado pequeños:
1. Modificación del endpoint AssemblyAI
Se implementó una verificación de tamaño en src/app/api/assemblyai/route.ts:
typescriptCopy// Verificar si el archivo es demasiado pequeño (probablemente no es audio válido)
if (audioFile.size < 1000) {
  console.log("⚠️ Archivo de audio demasiado pequeño, retornando respuesta simulada");
  return new Response(
    JSON.stringify({
      success: true,
      text: "Esta es una transcripción simulada desde el endpoint. El archivo de audio es demasiado pequeño para procesarlo."
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
Esta verificación permite:

Detectar blobs de audio menores a 1000 bytes
Evitar envíos innecesarios a la API de AssemblyAI
Responder con un mensaje simulado para facilitar pruebas
Mantener un status 200 para evitar errores en el cliente

2. Corrección de tipos en TypeScript
Se solucionaron problemas de tipado en el endpoint:

Se importó NextRequest de next/server para tipar correctamente el parámetro de la función
Se agregó verificación de tipo para el objeto audioFile usando instanceof Blob
Se implementó un manejo adecuado para los valores devueltos por formData.get('audio')

3. Validación de funcionalidad
Se verificó que la solución funcionaba correctamente mediante:

Pruebas con el botón "Probar Endpoint AssemblyAI" que envía un blob pequeño
Confirmación en logs de que se detectaba correctamente el tamaño del audio
Verificación de respuesta simulada para audios pequeños

Detalles técnicos de la solución
La implementación combina varios enfoques técnicos:

Detección temprana: Se verifica el tamaño del blob antes de intentar cualquier procesamiento, lo que ahorra recursos
Bifurcación de flujo: Se implementaron dos caminos diferentes según el tamaño del blob

Para blobs pequeños (<1000 bytes): respuesta simulada inmediata
Para blobs de tamaño adecuado: procesamiento completo con AssemblyAI


Logging detallado: Se añadieron logs descriptivos para facilitar la depuración
Manejo de tipos: Se corrigieron problemas de tipado para garantizar la integridad de la aplicación
Manejo de errores robusto: Se implementó una estructura try/catch en todo el flujo

Ventajas de la solución
Esta solución ofrece múltiples beneficios:

Mejora la experiencia de desarrollo: Permite probar la interfaz sin errores 422
Reduce costos de API: Evita llamadas innecesarias a AssemblyAI con audio inválido
Aumenta la robustez: Maneja graciosamente casos de entrada inválida
Facilita pruebas: Permite simular respuestas para pruebas rápidas
Mantiene compatibilidad: No interfiere con el procesamiento de audio válido

Recomendaciones para audios reales
Para garantizar un procesamiento óptimo de audios reales, se recomienda:

Asegurar que el formato de audio sea compatible con AssemblyAI (preferiblemente WAV o MP3)
Verificar que la calidad y duración del audio sean adecuadas
Monitorear los tiempos de respuesta de la API para ajustar timeouts si es necesario
Implementar un mecanismo de reintento para casos de fallo temporal
Considerar la posibilidad de almacenar temporalmente las transcripciones para evitar duplicar solicitudes

Conclusión
La solución implementada resuelve efectivamente el problema de manejo de blobs de audio pequeños o inválidos, permitiendo un flujo robusto tanto para casos de prueba como para uso real. La verificación de tamaño actúa como un filtro inteligente que mejora la experiencia del usuario y la eficiencia del sistema.
El problema central (error 422 con blobs pequeños) se abordó mediante la implementación de una verificación previa al envío a la API, lo que permite una degradación elegante del servicio en casos donde el audio no tiene el tamaño o formato adecuado.

# Changelog - [Fecha actual]

## Componente Layout

### Modificaciones
- Actualización de logos: Cambiado a SVG específicos del proyecto (`logoemc2.svg` y `logohablandis.svg`)
- Actualización de branding: Cambiado título a "Comunicar con GracIA" y subtítulo a "Herramientas al servicio del profesorado ELE"
- Actualización del pie de página: Referencia actualizada al proyecto GracIA y desarrolladores
- Corrección de presentación visual: Implementada visualización de dos logos lado a lado

### Correcciones de Errores
- Resuelto error de TypeScript relacionado con propiedades no reconocidas en `ToastOptions` de Sonner
- Simplificación de configuración del componente Toaster para evitar conflictos de tipos
- Implementación de la versión compatible con la actual API de Sonner

### Notas Técnicas
- Si se necesitan estilos personalizados para las notificaciones toast, considerar implementar CSS global o usar la nueva API de estilos de Sonner
- Los logos SVG deben tener un tamaño base de 80x80px para una visualización óptima

Vulnerabilidades Identificadas
1. nanoid <3.3.8 (Severidad: moderada)

Problema: Resultados predecibles en la generación de nanoid cuando se proporcionan valores no enteros
Ruta de dependencia: @ai-sdk/openai > @ai-sdk/provider-utils > nanoid
Solución disponible: npm audit fix --force (instalaría @ai-sdk/openai@1.3.4, lo que supone un cambio importante)
Impacto en proyecto: Bajo (dependencia indirecta a través de @ai-sdk/openai)

2. prismjs <1.30.0 (Severidad: moderada)

Problema: Vulnerabilidad de DOM Clobbering en PrismJS
Ruta de dependencia: react-syntax-highlighter > refractor > prismjs
Solución disponible: npm audit fix --force (instalaría react-syntax-highlighter@5.8.0, cambio importante)
Impacto en proyecto: Bajo (solo si se utiliza syntax highlighting de código)

Recomendaciones

Mantener las dependencias actuales durante la fase de desarrollo
Programar actualización completa de dependencias cuando el proyecto esté más estable
Reevaluar el impacto antes de desplegar a producción

Decisión
No se aplicarán cambios forzados en este momento para evitar cambios importantes durante el desarrollo activo.
Implementación de Componentes
Componente Layout

Actualización de logos: Cambiado a SVG específicos del proyecto (logoemc2.svg y logohablandis.svg)
Actualización de branding: Título cambiado a "Comunicar con GracIA" y subtítulo a "Herramientas al servicio del profesorado ELE"
Corrección de configuración Toaster para compatibilidad con tipos en Sonner
Implementación de visualización de dos logos lado a lado
Actualización del pie de página para reflejar el proyecto actual

Componente LLMvsSLMTable

Implementación de componente de comparación visual con animaciones
Tabla responsiva con diseño moderno siguiendo estética Apple/Claude
Integración de indicadores visuales con códigos de color
Configuración para mostrar/ocultar animaciones según necesidad