'use client';

import React, { useState, useRef, useEffect } from 'react';
import { assemblyAIService } from '@/lib/services/assemblyai-service';

export default function TestVoiceRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Inicializar el grabador de audio
  useEffect(() => {
    async function setupMediaRecorder() {
      console.log("🎤 Intentando configurar MediaRecorder...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Permiso de micrófono concedido, creando MediaRecorder");
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          console.log(`📊 Chunk de audio recibido: ${event.data.size} bytes`);
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          console.log("🛑 Grabación detenida, procesando chunks de audio");
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log(`📦 Blob de audio creado: ${audioBlob.size} bytes`);
          audioChunksRef.current = [];
          await processAudio(audioBlob);
        };
        
        mediaRecorderRef.current = mediaRecorder;
        console.log("✅ MediaRecorder configurado correctamente");
      } catch (err) {
        console.error('❌ Error al acceder al micrófono:', err);
        setError(`Error al acceder al micrófono: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    setupMediaRecorder();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log("🧹 Limpiando: Deteniendo MediaRecorder activo");
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Procesar el audio grabado
  const processAudio = async (audioBlob: Blob) => {
    console.log("🔄 Iniciando procesamiento de audio");
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log("📤 Enviando audio a AssemblyAI", audioBlob.size, "bytes");
      const result = await assemblyAIService.transcribeAudio(audioBlob);
      console.log("📥 Respuesta recibida de AssemblyAI:", result);
      
      if (result.success) {
        console.log("✅ Transcripción exitosa:", result.text);
        setTranscript(result.text);
      } else {
        console.error("❌ Error en la transcripción:", result.error);
        setError(result.error || 'Error al procesar el audio');
        setTranscript('');
      }
    } catch (err) {
      console.error("❌ Excepción durante el procesamiento:", err);
      setError(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      console.log("🏁 Procesamiento de audio finalizado");
      setIsProcessing(false);
    }
  };

  // Iniciar/detener la grabación
  const toggleRecording = () => {
    console.log("🔘 Botón de grabación presionado. Estado actual:", isRecording ? "Grabando" : "No grabando");
    
    if (!mediaRecorderRef.current) {
      console.error("❌ MediaRecorder no está inicializado");
      setError('El grabador de audio no está listo');
      return;
    }
    
    if (isRecording) {
      console.log("🛑 Deteniendo grabación");
      mediaRecorderRef.current.stop();
    } else {
      console.log("▶️ Iniciando grabación");
      setTranscript('');
      setError(null);
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
    }
    
    setIsRecording(!isRecording);
    console.log("🔄 Estado de grabación cambiado a:", !isRecording ? "Grabando" : "No grabando");
  };

  // Nueva función para probar el endpoint directamente
  const testEndpoint = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      console.log("🧪 Iniciando prueba del endpoint AssemblyAI");
      
      // Crear un blob de audio de prueba pequeño
      const testAudio = new Blob(['test audio content'], { type: 'audio/webm' });
      console.log(`📦 Blob de audio de prueba creado: ${testAudio.size} bytes`);
      
      // Crear FormData
      const formData = new FormData();
      formData.append('audio', testAudio);
      
      // Enviar al endpoint
      console.log("📤 Enviando audio de prueba al endpoint");
      const response = await fetch('/api/assemblyai', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log("📥 Respuesta del endpoint:", result);
      
      // Mostrar resultado
      if (result.success) {
        setTranscript(`Prueba exitosa! Respuesta: ${result.text}`);
      } else {
        setError(`Error en prueba del endpoint: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error en prueba del endpoint:", error);
      setError(`Error en prueba del endpoint: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Prueba de Reconocimiento de Voz con AssemblyAI</h1>
      
      <div className="mb-6 flex flex-col items-center">
        <button
          onClick={toggleRecording}
          disabled={!mediaRecorderRef.current || isProcessing}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : isProcessing
              ? 'bg-yellow-500'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ) : isProcessing ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        <p className="mt-2 text-sm text-gray-600">
          {isRecording ? 'Grabando... Haga clic para detener' : isProcessing ? 'Procesando audio...' : 'Haga clic para grabar'}
        </p>
        
        <div className="flex space-x-2 mt-4">
          {/* Botón de prueba simple */}
          <button
            onClick={() => {
              console.log("🧪 Botón de prueba simple presionado");
              setTranscript("Esta es una transcripción simulada desde el botón de prueba simple");
            }}
            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded"
          >
            Prueba Simple (Sin Grabación)
          </button>
          
          {/* Nuevo botón para probar el endpoint */}
          <button
            onClick={testEndpoint}
            disabled={isProcessing}
            className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded"
          >
            Probar Endpoint AssemblyAI
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {transcript && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Transcripción</h2>
          <div className="p-3 bg-gray-100 rounded-md">
            <p>{transcript}</p>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-1">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Haga clic en el botón para comenzar a grabar.</li>
          <li>Hable claramente en su micrófono.</li>
          <li>Haga clic nuevamente para detener la grabación.</li>
          <li>El audio se enviará a AssemblyAI para su transcripción.</li>
          <li>La transcripción aparecerá en pantalla cuando esté lista.</li>
        </ol>
      </div>
    </div>
  );
}