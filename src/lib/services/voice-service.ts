// src/lib/services/voice-service.ts
import axios from 'axios';

// Interfaz para las opciones de síntesis de voz
interface SynthesisOptions {
  text: string;
  voiceId?: string; // ID de la voz en ElevenLabs
  stability?: number; // Control de estabilidad (0.0 - 1.0)
  similarityBoost?: number; // Control de similitud (0.0 - 1.0)
  style?: number; // Control de estilo (0.0 - 1.0)
  speakerBoost?: boolean; // Mejora la claridad del hablante
  useBreathingMarkers?: boolean; // Añade marcadores de respiración
}

// Interfaz para eventos de síntesis de voz
interface VoiceEventHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
}

class VoiceService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  private audioElement: HTMLAudioElement | null = null;
  private defaultVoiceId: string;
  private eventHandlers: VoiceEventHandlers = {};

  constructor(apiKey: string, defaultVoiceId: string) {
    this.apiKey = apiKey;
    this.defaultVoiceId = defaultVoiceId;
    
    // Creamos el elemento de audio si estamos en el navegador
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      
      // Configuramos los listeners para eventos
      this.audioElement.addEventListener('play', () => {
        if (this.eventHandlers.onStart) this.eventHandlers.onStart();
      });
      
      this.audioElement.addEventListener('ended', () => {
        if (this.eventHandlers.onEnd) this.eventHandlers.onEnd();
      });
      
      this.audioElement.addEventListener('error', (e) => {
        if (this.eventHandlers.onError) this.eventHandlers.onError(e);
      });
      
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.eventHandlers.onProgress && this.audioElement) {
          const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
          this.eventHandlers.onProgress(progress);
        }
      });
    }
  }

  // Método para configurar manejadores de eventos
  setEventHandlers(handlers: VoiceEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Método para preprocesar el texto para mejorar la naturalidad
  private preprocessText(text: string, useBreathingMarkers: boolean): string {
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
  }

  // Método principal para sintetizar voz
  async synthesize(options: SynthesisOptions): Promise<void> {
    try {
      const {
        text,
        voiceId = this.defaultVoiceId,
        stability = 0.35, // Valor optimizado para mayor naturalidad
        similarityBoost = 0.75, // Valor optimizado para balance
        style = 0.15, // Valor optimizado para expresividad
        useBreathingMarkers = true
      } = options;
      
      // Preprocesamos el texto para mejorar naturalidad
      const processedText = this.preprocessText(text, useBreathingMarkers);
      
      // Configuramos los parámetros para la API
      const requestData = {
        text: processedText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: true
        }
      };
      
      // Hacemos la petición a la API
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/text-to-speech/${voiceId}`,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        responseType: 'blob'
      });
      
      // Creamos un objeto URL para el audio
      const audioUrl = URL.createObjectURL(response.data);
      
      // Reproducimos el audio si estamos en el navegador
      if (this.audioElement) {
        this.audioElement.src = audioUrl;
        await this.audioElement.play();
      }
      
    } catch (error) {
      console.error('Error en la síntesis de voz:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(error);
      }
    }
  }

  // Método para detener la reproducción
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  // Método para pausar la reproducción
  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  // Método para reanudar la reproducción
  resume(): void {
    if (this.audioElement) {
      this.audioElement.play();
    }
  }

  // Método para verificar si está reproduciendo
  isPlaying(): boolean {
    return !!(this.audioElement && !this.audioElement.paused);
  }
}

// Exportamos una instancia singleton (se debe configurar con la API key en la inicialización de la app)
let voiceServiceInstance: VoiceService | null = null;

export const initVoiceService = (apiKey: string, defaultVoiceId: string): VoiceService => {
  voiceServiceInstance = new VoiceService(apiKey, defaultVoiceId);
  return voiceServiceInstance;
};

export const getVoiceService = (): VoiceService => {
  if (!voiceServiceInstance) {
    throw new Error('Voice service not initialized. Call initVoiceService first.');
  }
  return voiceServiceInstance;
};

export default VoiceService;