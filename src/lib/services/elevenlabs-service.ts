import axios from 'axios';

/**
 * Opciones para la síntesis de voz
 */
export interface SpeechOptions {
  /** Texto a sintetizar */
  text: string;
  /** ID de la voz a utilizar */
  voiceId: string;  // Hacer que este campo sea obligatorio
  /** ID del modelo a utilizar (opcional) */
  modelId?: string;
  /** Nivel de estabilidad (0.0-1.0) */
  stability?: number;
  /** Nivel de similitud (0.0-1.0) */
  similarityBoost?: number;
  /** Estilo de la voz (0-100) */
  style?: number;
}

/**
 * Servicio para interactuar con la API de ElevenLabs
 */
export const ElevenLabsService = {
  /**
   * Convierte texto a voz usando nuestra API
   * @param options Opciones para la conversión
   * @returns Blob con el audio
   */
  async synthesizeSpeech(options: SpeechOptions): Promise<Blob> {
    try {
      // Validación básica
      if (!options.text?.trim()) {
        throw new Error('El texto no puede estar vacío');
      }
      
      // Realizar la solicitud a nuestra API
      const response = await axios.post(
        '/api/elevenlabs',
        {
          text: options.text,
          voiceId: options.voiceId,  // Usar el ID de la voz proporcionada
          modelId: options.modelId,
          stability: options.stability,
          similarityBoost: options.similarityBoost,
          style: options.style
        },
        {
          responseType: 'blob'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error en la síntesis de voz:', error);
      throw error;
    }
  }
};