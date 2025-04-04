// src/lib/data/script-data.ts

export interface ScriptSegment {
  id: string;             // Identificador único para el segmento
  scene: number;          // Número de escena
  speaker: 'Armando' | 'LIA'; // Quién habla
  text: string;           // Texto que se dirá/mostrará
  keywords: string[];     // Palabras clave para reconocimiento
  visualType?: 'image' | 'table' | 'react' | 'text'; // Tipo de visualización (añadido 'text')
  visualContent?: string; // URL de imagen, componente o texto a mostrar
  responseVoice?: boolean; // Si el texto debe ser leído por voz
  isActive?: boolean;     // Si es el segmento activo actualmente
  isCompleted?: boolean;  // Si ya se ha completado este segmento
  
  // Nuevos campos para control preciso de visualizaciones
  visualTiming?: 'start' | 'middle' | 'end' | 'afterResponse' | 'onPhrase'; // Cuándo mostrar la visualización
  visualTriggerPhrase?: string; // Frase específica que activa la visualización
  visualDelay?: number;   // Tiempo de retraso antes de mostrar la visualización (ms)
  visualDuration?: number; // Duración de la visualización (ms) - opcional, 0 para permanente
  visualPersist?: boolean; // Si la visualización debe mantenerse hasta que otra la reemplace
}

// Guión base (primeras tres escenas)
export const initialLiaScript: ScriptSegment[] = [
  {
    id: 'escena0-armando-bienvenida',
    scene: 0,
    speaker: 'Armando',
    text: 'Muchas gracias por estar con nosotros aquí en Praga, es siempre un placer estar aquí en este espacio creado por nosotros.',
    keywords: ['gracias', 'nosotros', 'Praga', 'placer', 'espacio'],
    visualType: 'text',
    visualContent: '<h1 class="text-3xl font-bold text-center text-gray-800 mb-4">BIENVENIDOS Y BIENVENIDAS</h1><p class="text-xl text-center text-gray-600">¡Gracias por estar con nosotros!</p>',
    responseVoice: false,
    isActive: false,
    isCompleted: false,
    visualPersist: false,
    visualTiming: 'start'
  },
  {
    id: 'escena1-lia-saludo',
    scene: 1,
    speaker: 'LIA',
    text: 'Hola Armando, ¿cómo te sientes en Varsovia? Me habías dicho has vivido en Polonia 13 años, en especial en Varsovia a la que consideras todavía tu casa. Me comentaste que ibas a un encuentro en el Instituto Cervantes de Varsovia, que por cierto está muy cerca de donde vivías. Ay me he liado, a ver dime: ¿cómo te encuentras en Varsovia?',
    keywords: ['hola', 'varsovia', 'encuentras', 'sientes'],
    visualType: 'image',
    visualContent: '/armando-en-varsovia.jpg',
    responseVoice: true,
    isActive: false,
    isCompleted: false,
    visualTiming: 'start', // Mostrar al inicio de la intervención de LIA
    visualDelay: 500 // Mostrar después de medio segundo
  },
  {
    id: 'escena1-armando-respuesta',
    scene: 1,
    speaker: 'Armando',
    text: 'Estoy feliz, es verdad. Varsovia es todavía mi casa y la quiero mucho. ¿Te sientes bien en Varsovia?',
    keywords: ['feliz', 'varsovia', 'casa', 'quiero'],
    isActive: false,
    isCompleted: false
  },
  {
    id: 'escena2-lia-respuesta',
    scene: 2,
    speaker: 'LIA',
    text: 'Bueno ya sabes que soy dependiente de ti, pero por ahora y dice JAJAJA. No voy a reírme porque no me gusta como se oye. Hemos pasado mucho tiempo juntos y realmente si estás contento, yo también. Por cierto, hace muy buen tiempo. En Madrid casi llegáis a salir en un bote, por Dios. De hecho por primera vez en la historia de los que están vivos el río Manzanares fue un río de verdad. Mirad en esta foto normalmente y mirad esta segunda. Ahí si hay potencia.',
    keywords: ['dependiente', 'contento', 'madrid', 'bote', 'manzanares', 'río'],
    visualType: 'image',
    visualContent: '/manzanares.jpg',
    responseVoice: true,
    isActive: false,
    isCompleted: false,
    visualTiming: 'onPhrase', // Mostrar cuando se mencione la frase específica
    visualTriggerPhrase: 'el río Manzanares fue un río de verdad', // Frase que activa la visualización
    visualDelay: 300 // Mostrar después de 300ms
  },
  {
    id: 'escena2-armando-respuesta',
    scene: 2,
    speaker: 'Armando',
    text: 'Siempre tan maja e irónica. Pero bueno recuerda que no estamos solos.',
    keywords: ['maja', 'irónica', 'solos'],
    isActive: false,
    isCompleted: false
  },
  {
    id: 'escena3-lia-presentacion',
    scene: 3,
    speaker: 'LIA',
    text: 'Ay, perdonad, es que me lio, como siempre. Buenas tardes a todos, me llamo LIA, la que no la lia trabajando, pero sí hablando. Soy un SLM casi LLM desarrollado por E=MC2 con la finalidad de crear herramientas educativas pensadas para la enseñanza aprendizaje del español como lengua extranjera. Algunas de ellas las enseñaremos hoy… ¿Es así, verdad?',
    keywords: ['perdonad', 'buenas tardes', 'me llamo LIA', 'SLM', 'LLM', 'E=MC2', 'herramientas'],
    responseVoice: true,
    isActive: false,
    isCompleted: false
  },
  {
    id: 'escena3-armando-confirmacion',
    scene: 3,
    speaker: 'Armando',
    text: 'Sí, si las enseñaremos. Antes dos cuestiones E=MC2 es una startup pensada para el uso de herramientas de IA aplicadas para la enseñanza de español como lengua extranjera. Y bueno entremos un poco en tarea explica un poco las diferencias entre un SLM y un LLM.',
    keywords: ['sí', 'enseñaremos', 'startup', 'diferencias', 'SLM', 'LLM'],
    isActive: false,
    isCompleted: false,
    visualTiming: 'afterResponse', // Mostrar después de que Armando hable
    visualDelay: 1000 // Mostrar después de 1 segundo
  },
  {
    id: 'escena3-lia-explicacion',
    scene: 3,
    speaker: 'LIA',
    text: 'Usemos una historia que puede ser de risa o no, es que soy mala contando chistes. Aquí va un chef consulta sobre una receta: Chef: "¿Qué puedo hacer con tomates?" SLM: "Salsa de tomate, simple y deliciosa." LLM: "Podrías preparar gazpacho andaluz, pasta al pomodoro, shakshuka, bruschetta, tomates rellenos..."',
    keywords: ['historia', 'chef', 'tomates', 'SLM', 'LLM', 'salsa', 'gazpacho'],
    visualType: 'table',
    visualContent: 'LLMvsSLM', // Este sería un componente específico que crearemos
    responseVoice: true,
    isActive: false,
    isCompleted: false,
    visualTiming: 'middle', // Mostrar en medio de la intervención de LIA
    visualTriggerPhrase: 'Aquí va un chef consulta', // Frase aproximada para mostrar en medio
    visualDelay: 500 // Mostrar después de medio segundo
  }
];

// Función que intenta cargar el guión desde localStorage (solo en el cliente)
const loadScriptFromStorage = (): ScriptSegment[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedScript = localStorage.getItem('liaScript');
      if (savedScript) {
        return JSON.parse(savedScript);
      }
    } catch (e) {
      console.error('Error al cargar el guión desde localStorage:', e);
    }
  }
  return initialLiaScript;
};

// Guión principal (se actualizará dinámicamente)
export const liaScript: ScriptSegment[] = 
  typeof window === 'undefined' ? initialLiaScript : loadScriptFromStorage();

// Para compatibilidad con código existente
export const demoScript: ScriptSegment[] = liaScript;