import { ScriptSegment, demoScript } from '../data/script-data';

// Interfaz para escenas (opcional, para organización mejorada)
export interface ScriptScene {
  id: number;
  title: string;
  segments: ScriptSegment[];
}

export interface VisualizationData {
  type?: string;
  content?: any;
  timestamp: number;
  segmentId: string;
  isPersistent?: boolean; // Nuevo campo para indicar si la visualización es persistente
}

export interface ScriptState {
  segments: ScriptSegment[];
  currentIndex: number;
  isActive: boolean;
  // Campos opcionales para soporte de escenas
  scenes?: ScriptScene[];
  currentSceneIndex?: number;
  // Nuevos campos para visualización
  currentVisualization?: VisualizationData;
  lastVisualization?: VisualizationData; // Almacena la última visualización mostrada
  lastSpokenPhrase?: string;
}

export class EnhancedScriptManager {
  private state: ScriptState;
  private listeners: ((state: ScriptState) => void)[] = [];
  private segmentToSceneMap: Map<string, number> = new Map();
  private currentSpeechText: string = ''; // Almacena el texto actual que se está hablando
  private phraseCheckInterval: number | null = null;

  // Constante para tipos de visualización soportados
  private readonly SUPPORTED_VISUALIZATION_TYPES = ['image', 'table', 'react', 'text'];

  constructor(initialScript: ScriptSegment[] = demoScript) {
    // Mantiene la compatibilidad con la estructura actual plana
    this.state = {
      segments: initialScript,
      currentIndex: 0,
      isActive: false,
      currentVisualization: undefined,
      lastVisualization: undefined,
      lastSpokenPhrase: ''
    };
    
    // Opcionalmente, podríamos convertir los segmentos en escenas estructuradas
    // this.convertToScenes(initialScript);
  }

  // Método para verificar si un tipo de visualización es válido
  private isValidVisualizationType(type?: string): boolean {
    if (!type) return false;
    return this.SUPPORTED_VISUALIZATION_TYPES.includes(type);
  }

  // Método para convertir el array plano a una estructura por escenas
  convertToScenes(segments: ScriptSegment[]): void {
    // Agrupar segmentos por número de escena
    const sceneMap = new Map<number, ScriptSegment[]>();
    
    segments.forEach(segment => {
      if (!sceneMap.has(segment.scene)) {
        sceneMap.set(segment.scene, []);
      }
      sceneMap.get(segment.scene)!.push(segment);
    });
    
    // Crear array de escenas ordenado
    const scenes: ScriptScene[] = [];
    
    // Ordenar las escenas por número
    const sceneNumbers = Array.from(sceneMap.keys()).sort((a, b) => a - b);
    
    sceneNumbers.forEach(sceneNumber => {
      scenes.push({
        id: sceneNumber,
        title: `Escena ${sceneNumber}`,
        segments: sceneMap.get(sceneNumber)!
      });
    });
    
    // Actualizar el estado
    this.state.scenes = scenes;
    this.state.currentSceneIndex = 0;
    
    // Crear mapa de segmentos a escenas para referencia rápida
    this.buildSegmentToSceneMap(scenes);
  }

  // Construir mapa de segmentos a escenas
  private buildSegmentToSceneMap(scenes: ScriptScene[]): void {
    scenes.forEach((scene, sceneIndex) => {
      scene.segments.forEach(segment => {
        this.segmentToSceneMap.set(segment.id, sceneIndex);
      });
    });
  }

  // Obtener el estado actual del guión
  getState(): ScriptState {
    return { ...this.state };
  }

  // Obtener el segmento actual
  getCurrentSegment(): ScriptSegment | null {
    if (this.state.currentIndex >= 0 && this.state.currentIndex < this.state.segments.length) {
      return this.state.segments[this.state.currentIndex];
    }
    return null;
  }

  // Obtener la escena actual (si hay escenas)
  getCurrentScene(): ScriptScene | null {
    if (!this.state.scenes || this.state.currentSceneIndex === undefined) {
      return null;
    }
    
    return this.state.scenes[this.state.currentSceneIndex] || null;
  }

  // Avanzar al siguiente segmento
  nextSegment(): ScriptSegment | null {
    if (this.state.currentIndex < this.state.segments.length - 1) {
      this.state.currentIndex += 1;
      
      // Actualizar el índice de escena si es necesario
      this.updateCurrentSceneIndex();
      
      // Manejar persistencia de visualización
      this.handleVisualizationPersistence();
      
      // Resetear estado de seguimiento de frases
      this.resetPhraseTracking();
      
      this.notifyListeners();
      return this.getCurrentSegment();
    }
    return null;
  }

  // Retroceder al segmento anterior
  previousSegment(): ScriptSegment | null {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex -= 1;
      
      // Actualizar el índice de escena si es necesario
      this.updateCurrentSceneIndex();
      
      // Manejar persistencia de visualización
      this.handleVisualizationPersistence();
      
      // Resetear estado de seguimiento de frases
      this.resetPhraseTracking();
      
      this.notifyListeners();
      return this.getCurrentSegment();
    }
    return null;
  }

  // Ir a un segmento específico por índice
  goToIndex(index: number): ScriptSegment | null {
    if (index >= 0 && index < this.state.segments.length) {
      this.state.currentIndex = index;
      
      // Actualizar el índice de escena si es necesario
      this.updateCurrentSceneIndex();
      
      // Manejar persistencia de visualización
      this.handleVisualizationPersistence();
      
      // Resetear estado de seguimiento de frases
      this.resetPhraseTracking();
      
      this.notifyListeners();
      return this.getCurrentSegment();
    }
    return null;
  }

  // Ir a un segmento específico por ID
  goToSegmentById(id: string): ScriptSegment | null {
    const index = this.state.segments.findIndex(segment => segment.id === id);
    if (index !== -1) {
      return this.goToIndex(index);
    }
    return null;
  }

  // Ir a una escena específica (si hay escenas)
  goToScene(sceneIndex: number): ScriptSegment | null {
    if (!this.state.scenes || sceneIndex < 0 || sceneIndex >= this.state.scenes.length) {
      return null;
    }
    
    const scene = this.state.scenes[sceneIndex];
    if (scene && scene.segments.length > 0) {
      const firstSegmentId = scene.segments[0].id;
      this.state.currentSceneIndex = sceneIndex;
      return this.goToSegmentById(firstSegmentId);
    }
    
    return null;
  }

  // Buscar en el guión por palabras clave (mejorado)
  findSegmentByKeywords(text: string): { segment: ScriptSegment, confidence: number } | null {
    const normalizedText = text.toLowerCase();
    
    let bestMatch: { segment: ScriptSegment, confidence: number } | null = null;
    
    this.state.segments.forEach(segment => {
      if (!segment.keywords || segment.keywords.length === 0) return;
      
      let matchCount = 0;
      let keywordCount = segment.keywords.length;
      
      segment.keywords.forEach(keyword => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          matchCount++;
        } else {
          // Buscar palabras similares con tolerancia a errores
          const words = normalizedText.split(/\s+/);
          for (const word of words) {
            if (this.isWordSimilar(word, keyword.toLowerCase())) {
              matchCount += 0.7; // Coincidencia parcial
              break;
            }
          }
        }
      });
      
      if (matchCount > 0) {
        const confidence = matchCount / keywordCount;
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { segment, confidence };
        }
      }
    });
    
    return bestMatch;
  }

  // Método auxiliar para similitud de palabras
  private isWordSimilar(word: string, keyword: string): boolean {
    // Implementación básica: coincidencia de prefijo
    if (keyword.length > 3 && word.startsWith(keyword.substring(0, 3))) {
      return true;
    }
    return false;
  }

  // Calcular el progreso del guión (nueva función)
  getProgressPercentage(): number {
    if (this.state.segments.length === 0) return 0;
    
    return Math.round(((this.state.currentIndex + 1) / this.state.segments.length) * 100);
  }

  // Actualizar el índice de escena basado en el segmento actual
  private updateCurrentSceneIndex(): void {
    if (!this.state.scenes || this.state.currentSceneIndex === undefined) {
      return;
    }
    
    const currentSegment = this.getCurrentSegment();
    if (currentSegment) {
      const sceneIndex = this.segmentToSceneMap.get(currentSegment.id);
      if (sceneIndex !== undefined) {
        this.state.currentSceneIndex = sceneIndex;
      }
    }
  }

  // Activar/desactivar el script
  setActive(active: boolean): void {
    this.state.isActive = active;
    this.notifyListeners();
  }

  // Iniciar desde el principio
  start(): ScriptSegment | null {
    this.state.currentIndex = 0;
    if (this.state.scenes) {
      this.state.currentSceneIndex = 0;
    }
    this.state.isActive = true;
    this.resetPhraseTracking();
    this.clearAllVisualizations(); // Limpiar todas las visualizaciones al iniciar
    this.notifyListeners();
    return this.getCurrentSegment();
  }

  // Cargar un nuevo guión
  loadScript(script: ScriptSegment[], scenes?: ScriptScene[]): void {
    this.state.segments = script;
    this.state.currentIndex = 0;
    
    if (scenes) {
      this.state.scenes = scenes;
      this.state.currentSceneIndex = 0;
      this.buildSegmentToSceneMap(scenes);
    } else {
      this.state.scenes = undefined;
      this.state.currentSceneIndex = undefined;
      this.segmentToSceneMap.clear();
    }
    
    this.resetPhraseTracking();
    this.clearAllVisualizations(); // Limpiar todas las visualizaciones al cargar nuevo guión
    this.notifyListeners();
  }

  // ----- MÉTODOS PARA CONTROL DE VISUALIZACIÓN -----

  // Establecer el texto actual que se está hablando
  setCurrentSpeechText(text: string): void {
    this.currentSpeechText = text;
    this.checkForTriggerPhrases();
  }

  // Actualizar cuando se ha hablado más texto
  updateSpokenText(additionalText: string): void {
    this.state.lastSpokenPhrase = additionalText;
    this.checkForTriggerPhrases();
    this.notifyListeners();
  }

  // Verificar si el texto actual contiene alguna frase disparadora
  private checkForTriggerPhrases(): void {
    const currentSegment = this.getCurrentSegment();
    
    if (!currentSegment || !this.isValidVisualizationType(currentSegment.visualType) || !currentSegment.visualContent) {
      return;
    }
    
    // Verificar si hay una frase específica que deba activar la visualización
    if (currentSegment.visualTiming === 'onPhrase' && 
        currentSegment.visualTriggerPhrase && 
        this.currentSpeechText.includes(currentSegment.visualTriggerPhrase)) {
      
      // Evitar activar múltiples veces la misma visualización
      if (!this.state.currentVisualization || 
          this.state.currentVisualization.segmentId !== currentSegment.id) {
        this.triggerVisualization(currentSegment);
      }
    }
  }

  // Activar visualización para un segmento específico
  triggerVisualization(segment: ScriptSegment): void {
    if (!this.isValidVisualizationType(segment.visualType) || !segment.visualContent) return;
    
    // Guardar la visualización actual como última visualización antes de reemplazarla
    // Solo guardamos si no es persistente o si la nueva visualización es explícita
    if (this.state.currentVisualization && 
        (!this.state.currentVisualization.isPersistent || 
          (this.isValidVisualizationType(segment.visualType) && segment.visualContent))) {
      this.state.lastVisualization = {...this.state.currentVisualization};
    }
    
    // Crear la nueva visualización con el flag de persistencia del segmento
    const visualization: VisualizationData = {
      type: segment.visualType,
      content: segment.visualContent,
      timestamp: Date.now(),
      segmentId: segment.id,
      isPersistent: segment.visualPersist || false
    };
    
    this.state.currentVisualization = visualization;
    this.notifyListeners();
  }

  // Obtener la visualización activa con formato adecuado según el tipo
  getActiveVisualization(): any {
    if (this.state.currentVisualization) {
      const { type, content, isPersistent } = this.state.currentVisualization;
      
      if (this.isValidVisualizationType(type)) {
        // Formato especial para visualizaciones de tipo texto
        if (type === 'text') {
          return {
            type,
            content: {
              text: content,  // Asumimos que el contenido es el texto formateado
              title: '',      // Valor por defecto, podría personalizarse
            },
            isPersistent
          };
        }
        
        // Para otros tipos de visualización
        return {
          type,
          content,
          isPersistent
        };
      }
    }
    
    return null;
  }

  // Nuevo método: Determinar si debemos usar una visualización persistente para el segmento actual
  shouldUsePersistentVisualization(segment: ScriptSegment): boolean {
    // Si el segmento actual tiene visualización explícita, no usar persistente
    if (this.isValidVisualizationType(segment.visualType) && segment.visualContent) {
      return false;
    }
    
    // Si hay una visualización persistente activa
    if (this.state.currentVisualization?.isPersistent) {
      // Si estamos en una nueva escena, quizás queremos detener la persistencia
      const currentSceneIndex = segment.scene;
      const persistentVisualizationSegment = this.state.segments.find(
        s => s.id === this.state.currentVisualization?.segmentId
      );
      
      if (persistentVisualizationSegment) {
        const persistentSceneIndex = persistentVisualizationSegment.scene;
        
        // Si la visualización persistente es de otra escena, no usarla
        if (currentSceneIndex !== persistentSceneIndex) {
          return false;
        }
      }
      
      // En otro caso, sí usar la visualización persistente
      return true;
    }
    
    return false;
  }

  // Manejar la persistencia de visualizaciones al cambiar de segmento
  private handleVisualizationPersistence(): void {
    const currentSegment = this.getCurrentSegment();
    if (!currentSegment) return;
    
    // Determinar si debemos usar una visualización persistente
    const shouldUsePersistent = this.shouldUsePersistentVisualization(currentSegment);
    
    // Si el segmento actual tiene su propia visualización, usarla (reemplazará cualquier persistente)
    if (this.isValidVisualizationType(currentSegment.visualType) && currentSegment.visualContent) {
      // La visualización del segmento se aplicará cuando sea necesario
      return;
    }
    
    // Si no debemos usar una persistente, limpiar la visualización actual (si no es persistente)
    if (!shouldUsePersistent && this.state.currentVisualization && !this.state.currentVisualization.isPersistent) {
      this.state.lastVisualization = {...this.state.currentVisualization};
      this.state.currentVisualization = undefined;
    }
  }

  // Limpiar la visualización actual
  clearVisualization(): void {
    // No limpiar visualizaciones persistentes
    if (this.state.currentVisualization?.isPersistent) {
      return; // Mantener visualizaciones persistentes
    }
    
    if (this.state.currentVisualization) {
      this.state.lastVisualization = {...this.state.currentVisualization};
      this.state.currentVisualization = undefined;
      this.notifyListeners();
    }
  }

  // Limpiar todas las visualizaciones (actual y última)
  clearAllVisualizations(): void {
    this.state.lastVisualization = undefined;
    this.state.currentVisualization = undefined;
    this.notifyListeners();
  }

  // Restaurar la última visualización
  restoreLastVisualization(): void {
    if (this.state.lastVisualization) {
      this.state.currentVisualization = {...this.state.lastVisualization};
      this.state.lastVisualization = undefined;
      this.notifyListeners();
    }
  }

  // Comprobar si una visualización debe mostrarse
  shouldShowVisualization(status: string): boolean {
    const segment = this.getCurrentSegment();
    if (!segment) return false;
    
    // Si debemos usar una visualización persistente, mostrarla
    if (this.shouldUsePersistentVisualization(segment)) {
      return true;
    }
    
    // Si el segmento actual no tiene visualización válida, no mostrar nada
    if (!this.isValidVisualizationType(segment.visualType) || !segment.visualContent) return false;
    
    switch (segment.visualTiming) {
      case 'start':
        return segment.speaker === 'LIA' && status === 'speaking';
      
      case 'middle':
        return segment.speaker === 'LIA' && status === 'speaking' && 
               this.currentSpeechText.length > segment.text.length / 3;
      
      case 'end':
        return segment.speaker === 'LIA' && status === 'waiting';
      
      case 'afterResponse':
        return segment.speaker === 'Armando' && status === 'processing';
      
      case 'onPhrase':
        // Esta visualización se maneja en checkForTriggerPhrases
        return false;
      
      default:
        // Si no hay timing específico, mostrar por defecto
        return true;
    }
  }

  // Verificar si hay una visualización persistente activa
  hasPersistentVisualization(): boolean {
    return !!this.state.currentVisualization?.isPersistent;
  }

  // Verificar si una visualización es de tipo texto
  isTextVisualization(): boolean {
    return this.state.currentVisualization?.type === 'text';
  }

  // Obtener el contenido de texto formateado de una visualización
  getFormattedTextContent(): string | null {
    if (this.state.currentVisualization?.type === 'text') {
      return this.state.currentVisualization.content;
    }
    return null;
  }

  // Iniciar seguimiento de frases para detección
  startPhraseTracking(): void {
    this.resetPhraseTracking();
    
    // Verificar cada 500ms si hay frases que activen visualizaciones
    this.phraseCheckInterval = window.setInterval(() => {
      this.checkForTriggerPhrases();
    }, 500);
  }

  // Detener y limpiar el seguimiento de frases
  resetPhraseTracking(): void {
    this.currentSpeechText = '';
    this.state.lastSpokenPhrase = '';
    
    if (this.phraseCheckInterval !== null) {
      clearInterval(this.phraseCheckInterval);
      this.phraseCheckInterval = null;
    }
  }

  // Suscribirse a cambios
  subscribe(listener: (state: ScriptState) => void): () => void {
    this.listeners.push(listener);
    
    // Devolver función para cancelar suscripción
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a todos los suscriptores
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

// Instancia singleton para usar en toda la aplicación
export const enhancedScriptManager = new EnhancedScriptManager();

// Para mantener compatibilidad con código existente
export const scriptManager = enhancedScriptManager;

export default scriptManager;