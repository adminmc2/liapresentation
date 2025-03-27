import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Manejador para la ruta GET /api/elevenlabs/voices
 * Obtiene la lista de voces disponibles en ElevenLabs
 */
export async function GET(request: NextRequest) {
  try {
    // Configurar parámetros para ElevenLabs API
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key de ElevenLabs no configurada' },
        { status: 500 }
      );
    }

    // Realizar la solicitud a ElevenLabs
    const response = await axios({
      method: 'GET',
      url: 'https://api.elevenlabs.io/v1/voices',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });

    // Formatear la respuesta para hacerla más fácil de usar
    const voices = response.data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      previewUrl: voice.preview_url,
    }));

    // Devolver la lista de voces
    return NextResponse.json(voices, {
      headers: {
        'Cache-Control': 'public, max-age=3600' // Cachear por 1 hora
      }
    });
  } catch (error: any) {
    console.error('Error al obtener las voces:', error);
    
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
      { error: error.message || 'Error al obtener las voces' },
      { status: 500 }
    );
  }
}
