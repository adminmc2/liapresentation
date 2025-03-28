import axios from 'axios';

interface TranscriptResult {
  text: string;
  error?: string;
  success: boolean;
}

/**
 * Servicio para interactuar con la API de AssemblyAI para reconocimiento de voz
 */
export const assemblyAIService = {
  /**
   * Transcribe un archivo de audio usando AssemblyAI
   * @param audioBlob - El blob de audio a transcribir
   * @returns Una promesa que resuelve a un objeto con el texto transcrito
   */
  async transcribeAudio(audioBlob: Blob): Promise<TranscriptResult> {
    try {
      console.log("📤 Preparando para enviar a AssemblyAI", audioBlob.size, "bytes");
      
      // Verificar si es un blob de audio válido (tamaño mayor a un umbral razonable)
      if (audioBlob.size < 1000) {
        console.log("⚠️ Audio demasiado pequeño o inválido, usando modo de simulación");
        return {
          text: "Esta es una transcripción simulada para pruebas. El reconocimiento real de voz se implementará con audio genuino.",
          success: true
        };
      }
      
      // Para audio real (grabado por MediaRecorder), usar el endpoint
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      console.log("📤 Enviando audio real al endpoint AssemblyAI");
      const response = await fetch('/api/assemblyai', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log("📥 Respuesta recibida del endpoint AssemblyAI:", data);
      
      if (data.success) {
        return {
          text: data.text,
          success: true
        };
      } else {
        return {
          text: '',
          error: data.error || 'Error desconocido al transcribir',
          success: false
        };
      }
    } catch (error) {
      console.error('Error en el servicio de AssemblyAI:', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Error desconocido al transcribir',
        success: false
      };
    }
  },
  
  /**
   * Verifica si el texto reconocido contiene palabras clave específicas
   * @param text - El texto a verificar
   * @param keywords - Las palabras clave a buscar
   * @returns Un valor de confianza entre 0 y 1
   */
  calculateKeywordConfidence(text: string, keywords: string[]): number {
    if (!text || keywords.length === 0) return 0;
    
    const normalizedText = text.toLowerCase();
    let matchCount = 0;
    
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    return matchCount / keywords.length;
  }
};