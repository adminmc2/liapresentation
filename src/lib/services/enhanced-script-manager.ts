// src/lib/services/enhanced-script-manager.ts

import { ScriptSegment, demoScript } from '../data/script-data';

// Interfaz para escenas (opcional, para organización mejorada)
export interface ScriptScene {
  id: number;
  title: string;
  segments: ScriptSegment[];
}

export interface ScriptState {
  segments: ScriptSegment[];
  currentIndex: number;
  isActive: boolean;
  // Campos opcionales para soporte de escenas
  scenes?: ScriptScene[];
  currentSceneIndex?: number;
}

export class EnhancedScriptManager {
  private state: ScriptState;
  private listeners: ((state: ScriptState) => void)[] = [];
  private segmentToSceneMap: Map<string, number> = new Map();

  constructor(initialScript: ScriptSegment[] = demoScript) {
    // Mantiene la compatibilidad con la estructura actual plana
    this.state = {
      segments: initialScript,
      currentIndex: 0,
      isActive: false
    };
    
    // Opcionalmente, podríamos convertir los segmentos en escenas estructuradas
    // this.convertToScenes(initialScript);
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
    
    this.notifyListeners();
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