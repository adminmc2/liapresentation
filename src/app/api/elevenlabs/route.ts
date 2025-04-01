// src/app/api/elevenlabs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, modelId, stability, similarityBoost, style } = await req.json();
    
    // Verificar que tenemos los datos necesarios
    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'Texto y voiceId son requeridos' },
        { status: 400 }
      );
    }
    
    // Configurar los valores por defecto optimizados si no se especifican
    const voiceSettings = {
      stability: stability ?? 0.35, // Más bajo para mayor variación natural
      similarity_boost: similarityBoost ?? 0.75, // Equilibrado para mantener identidad
      style: style ?? 0.15, // Valor bajo pero presente para expresividad
      use_speaker_boost: true // Mejora claridad general
    };
    
    // Preparar la solicitud para ElevenLabs
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
      },
      data: {
        text,
        model_id: modelId || 'eleven_monolingual_v1',
        voice_settings: voiceSettings
      },
      responseType: 'arraybuffer'
    });
    
    // Devolver el audio generado
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    });
    
  } catch (error: any) {
    console.error('Error en la API de ElevenLabs:', error);
    
    // Intentar obtener un mensaje de error detallado
    let errorMessage = 'Error al generar el audio';
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status;
      try {
        // Intentar extraer el mensaje de error de la respuesta
        const errorData = JSON.parse(error.response.data.toString());
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear, usar el mensaje genérico
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}