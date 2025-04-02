// src/lib/services/enhanced-elevenlabs-service.ts
import axios from 'axios';

/**
 * Opciones para la síntesis de voz (mantiene compatibilidad con el servicio original)
 */
export interface SpeechOptions {
  /** Texto a sintetizar */
  text: string;
  /** ID de la voz a utilizar */
  voiceId: string;
  /** ID del modelo a utilizar (opcional) */
  modelId?: string;
  /** Nivel de estabilidad (0.0-1.0) */
  stability?: number;
  /** Nivel de similitud (0.0-1.0) */
  similarityBoost?: number;
  /** Estilo de la voz (0-100) */
  style?: number;
  /** Uso de marcadores de respiración para mayor naturalidad */
  useBreathingMarkers?: boolean;
  /** Usar caché para evitar regenerar el mismo audio */
  useCache?: boolean;
}

// Caché para evitar generar el mismo audio repetidamente
const audioCache = new Map<string, Blob>();

/**
 * Servicio mejorado para interactuar con la API de ElevenLabs
 */
export const EnhancedElevenLabsService = {
  /**
   * Preprocesa el texto para mejorar la naturalidad
   */
  preprocessText(text: string, useBreathingMarkers: boolean = true): string {
    let processedText = text;
    
    // Añadimos marcadores de respiración si se solicita
    if (useBreathingMarkers) {
      // Añadir respiraciones naturales después de comas, puntos, etc.
      processedText = processedText.replace(/([.!?])\s+/g, '$1 <break time="500ms"/> ');
      processedText = processedText.replace(/([,;:])\s+/g, '$1 <break time="300ms"/> ');
      
      // Añadir respiraciones adicionales en frases largas
      const sentences = processedText.split(/([.!?])\s+/);
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].length > 100) {
          // Para frases muy largas, añadir pausas adicionales
          sentences[i] = sentences[i].replace(/(\S{100,}?)[^\S\r\n]+/g, '$1 <break time="200ms"/> ');
        }
      }
      processedText = sentences.join('');
    }
    
    // Optimizamos palabras técnicas para mejor pronunciación
    processedText = processedText.replace(/\bLLM\b/g, 'L L M');
    processedText = processedText.replace(/\bSLM\b/g, 'S L M');
    processedText = processedText.replace(/\bIA\b/g, 'I A');
    
    return processedText;
  },

  /**
   * Convierte texto a voz usando la API
   * Mantiene compatibilidad con el servicio original
   * pero añade mejoras de naturalidad y rendimiento
   */
  async synthesizeSpeech(options: SpeechOptions): Promise<Blob> {
    try {
      // Validación básica
      if (!options.text?.trim()) {
        throw new Error('El texto no puede estar vacío');
      }
      
      const {
        text,
        voiceId,
        modelId = 'eleven_monolingual_v1',
        stability = 0.35, // Valor optimizado para mayor naturalidad
        similarityBoost = 0.75, // Valor optimizado para balance
        style = 0.15, // Valor optimizado para expresividad
        useBreathingMarkers = true,
        useCache = true
      } = options;
      
      // Crear clave para caché
      if (useCache) {
        const cacheKey = JSON.stringify({
          text,
          voiceId,
          modelId,
          stability,
          similarityBoost,
          style,
          useBreathingMarkers
        });
        
        // Verificar si ya tenemos este audio en caché
        if (audioCache.has(cacheKey)) {
          console.log('Usando audio en caché');
          return audioCache.get(cacheKey)!;
        }
      }
      
      // Preprocesamos el texto para mejorar naturalidad
      const processedText = this.preprocessText(text, useBreathingMarkers);
      
      // Realizar la solicitud a nuestra API proxy
      const response = await axios.post(
        '/api/elevenlabs',
        {
          text: processedText,
          voiceId: voiceId,
          modelId: modelId,
          stability: stability,
          similarityBoost: similarityBoost,
          style: style
        },
        {
          responseType: 'blob'
        }
      );
      
      // Guardamos en caché para futuras reproducciones si está activado
      if (useCache) {
        const cacheKey = JSON.stringify({
          text,
          voiceId,
          modelId,
          stability,
          similarityBoost,
          style,
          useBreathingMarkers
        });
        audioCache.set(cacheKey, response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error en la síntesis de voz mejorada:', error);
      throw error;
    }
  }
};

// Para mantener compatibilidad con código existente
export default EnhancedElevenLabsService;