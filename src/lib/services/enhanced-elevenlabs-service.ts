// src/lib/services/enhanced-script-manager.ts (ajustado)

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
  
  // Resto de métodos igual que en la implementación anterior...
  // (getState, getCurrentSegment, nextSegment, etc.)

  // Método actualizado para buscar por palabras clave con mayor precisión
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

  // Resto de métodos igual que en la implementación anterior...
}

// Instancia singleton para usar en toda la aplicación
export const enhancedScriptManager = new EnhancedScriptManager();

// Para mantener compatibilidad con código existente
export const scriptManager = enhancedScriptManager;