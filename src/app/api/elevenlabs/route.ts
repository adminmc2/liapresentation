import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Definir interfaces para los tipos
interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
}

interface ElevenLabsParams {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}

/**
 * Manejador para la ruta POST /api/elevenlabs
 * Convierte texto a voz utilizando ElevenLabs
 */
export async function POST(request: NextRequest) {
  try {
    // Extraer el cuerpo de la solicitud
    const body = await request.json();
    const { text, voiceId, modelId, stability, similarityBoost, style } = body;
    
    // Validación básica
    if (!text) {
      return NextResponse.json(
        { error: 'El texto es obligatorio' },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: 'El ID de voz es obligatorio' },
        { status: 400 }
      );
    }

    // Configurar parámetros para ElevenLabs API
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key de ElevenLabs no configurada' },
        { status: 500 }
      );
    }

    // Procesar el texto para mejorar la detección del idioma español
    let processedText = text;
    // Usar formato similar a un comentario HTML para indicar el idioma
    if (!processedText.includes("<!-- español -->")) {
      processedText = "<!-- español --> " + processedText;
    }

    // Configurar parámetros
    const params: ElevenLabsParams = {
      text: processedText,
      model_id: modelId || 'eleven_turbo_v2_5', // Intentar con el modelo más reciente
      voice_settings: {}
    };

    // Añadir parámetros opcionales si están presentes
    if (stability !== undefined) params.voice_settings.stability = stability;
    if (similarityBoost !== undefined) params.voice_settings.similarity_boost = similarityBoost;
    if (style !== undefined) params.voice_settings.style = style;

    // Realizar la solicitud a ElevenLabs
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      data: params,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      responseType: 'arraybuffer'
    });

    // Devolver el audio como respuesta
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error: any) {
    console.error('Error en la ruta de ElevenLabs:', error);
    
    // Manejar diferentes tipos de errores
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || error.message;
      
      return NextResponse.json(
        { error: message },
        { status: status }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error en la síntesis de voz' },
      { status: 500 }
    );
  }
}