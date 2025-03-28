// src/lib/services/script-manager.ts

import { ScriptSegment, demoScript } from '../data/script-data';

export interface ScriptState {
  segments: ScriptSegment[];
  currentIndex: number;
  isActive: boolean;
}

export class ScriptManager {
  private state: ScriptState;
  private listeners: ((state: ScriptState) => void)[] = [];

  constructor(initialScript: ScriptSegment[] = demoScript) {
    this.state = {
      segments: initialScript,
      currentIndex: 0,
      isActive: false
    };
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

  // Avanzar al siguiente segmento
  nextSegment(): ScriptSegment | null {
    if (this.state.currentIndex < this.state.segments.length - 1) {
      this.state.currentIndex += 1;
      this.notifyListeners();
      return this.getCurrentSegment();
    }
    return null;
  }

  // Retroceder al segmento anterior
  previousSegment(): ScriptSegment | null {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex -= 1;
      this.notifyListeners();
      return this.getCurrentSegment();
    }
    return null;
  }

  // Ir a un segmento específico por índice
  goToIndex(index: number): ScriptSegment | null {
    if (index >= 0 && index < this.state.segments.length) {
      this.state.currentIndex = index;
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

  // Buscar en el guión por palabras clave (para sincronización con voz)
  findSegmentByKeywords(text: string): { segment: ScriptSegment, confidence: number } | null {
    const normalizedText = text.toLowerCase();
    
    let bestMatch: { segment: ScriptSegment, confidence: number } | null = null;
    
    this.state.segments.forEach(segment => {
      let matchCount = 0;
      segment.keywords.forEach(keyword => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });
      
      if (matchCount > 0) {
        const confidence = matchCount / segment.keywords.length;
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { segment, confidence };
        }
      }
    });
    
    return bestMatch;
  }

  // Activar/desactivar el script
  setActive(active: boolean): void {
    this.state.isActive = active;
    this.notifyListeners();
  }

  // Cargar un nuevo guión
  loadScript(script: ScriptSegment[]): void {
    this.state.segments = script;
    this.state.currentIndex = 0;
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
export const scriptManager = new ScriptManager();