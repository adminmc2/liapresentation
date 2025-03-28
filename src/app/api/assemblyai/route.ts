import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Manejador para solicitudes POST
export async function POST(request: NextRequest) {
  console.log("🔍 Endpoint AssemblyAI invocado");
  try {
    // Verificamos que la API key esté configurada
    if (!process.env.ASSEMBLYAI_API_KEY) {
      console.error("❌ API key de AssemblyAI no configurada");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key de AssemblyAI no configurada' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extraemos el audio de la request
    console.log("📦 Extrayendo FormData de la solicitud");
    const formData = await request.formData();
    const audioFileValue = formData.get('audio');
    
    if (!audioFileValue) {
      console.error("❌ No se encontró el archivo de audio en la solicitud");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se encontró el archivo de audio en la solicitud' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar que sea un archivo (Blob o File)
    if (!(audioFileValue instanceof Blob)) {
      console.error("❌ El valor proporcionado no es un archivo válido");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'El valor proporcionado no es un archivo válido' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Ahora sabemos que es un Blob (o un File, que hereda de Blob)
    const audioFile = audioFileValue as Blob;
    console.log(`📊 Archivo de audio recibido: ${audioFile.size} bytes`);
    
    // Verificar si el archivo es demasiado pequeño (probablemente no es audio válido)
    if (audioFile.size < 1000) {
      console.log("⚠️ Archivo de audio demasiado pequeño, retornando respuesta simulada");
      return new Response(
        JSON.stringify({
          success: true,
          text: "Esta es una transcripción simulada desde el endpoint. El archivo de audio es demasiado pequeño para procesarlo."
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Convertimos el archivo a un buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Subimos el audio a AssemblyAI
    console.log("📤 Subiendo audio a AssemblyAI");
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', 
      Buffer.from(arrayBuffer),
      {
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/octet-stream'
        }
      }
    );
    
    const uploadUrl = uploadResponse.data.upload_url;
    console.log("📤 Audio subido a:", uploadUrl);
    
    // Creamos un trabajo de transcripción
    console.log("🔄 Creando trabajo de transcripción");
    const transcriptionResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadUrl,
        language_code: 'es'
      },
      {
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const transcriptId = transcriptionResponse.data.id;
    console.log("🔄 ID de transcripción:", transcriptId);
    
    // Obtenemos el resultado
    console.log("⏳ Esperando resultado de transcripción");
    let result = null;
    const maxAttempts = 30;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      const resultResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': process.env.ASSEMBLYAI_API_KEY
          }
        }
      );
      
      if (resultResponse.data.status === 'completed' || resultResponse.data.status === 'error') {
        result = resultResponse.data;
        break;
      }
      
      // Esperamos 1 segundo antes de intentar de nuevo
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempt++;
    }
    
    if (!result) {
      console.error("❌ Tiempo de espera excedido para la transcripción");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tiempo de espera excedido para la transcripción' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("📝 Resultado de transcripción recibido:", result.status);
    
    if (result.status === 'completed') {
      console.log("✅ Transcripción completada:", result.text);
      return new Response(
        JSON.stringify({ 
          success: true, 
          text: result.text 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.error("❌ Error en la transcripción:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || 'Error al transcribir el audio' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Error en el endpoint de AssemblyAI:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}