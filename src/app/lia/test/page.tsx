'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mic, Volume2, VolumeX, Loader2, AudioWaveform } from 'lucide-react';

import Layout from '@/components/Layout';
import LLMvsSLMTable from '@/components/LLMvsSLMTable';
import { assemblyAIService } from '@/lib/services/assemblyai-service';

// Integramos la funcionalidad de prueba de voz del componente TestVoiceRecognition existente
export default function ImprovedTestPage() {
  // Estados para pruebas de reconocimiento de voz
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Estados para síntesis de voz
  const [testText, setTestText] = useState(
    'Hola, soy LIA, tu asistente inteligente para esta presentación sobre modelos de lenguaje pequeños y grandes.'
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Estados para configuración de voz
  const [stability, setStability] = useState(0.35);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0.15);
  const [useBreathingMarkers, setUseBreathingMarkers] = useState(true);

  // Inicializar el grabador de audio
  useEffect(() => {
    async function setupMediaRecorder() {
      console.log("🎤 Intentando configurar MediaRecorder...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Permiso de micrófono concedido, creando MediaRecorder");
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          console.log("🛑 Grabación detenida, procesando chunks de audio");
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          await processAudio(audioBlob);
        };
        
        mediaRecorderRef.current = mediaRecorder;
        console.log("✅ MediaRecorder configurado correctamente");
      } catch (err) {
        console.error('❌ Error al acceder al micrófono:', err);
        setError(`Error al acceder al micrófono: ${err instanceof Error ? err.message : String(err)}`);
        toast.error(`Error al acceder al micrófono: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    setupMediaRecorder();
    
    // Inicializar elemento de audio para síntesis de voz
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      audioRef.current.onplay = () => {
        setIsSpeaking(true);
      };
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
      };
      
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setError("Error al reproducir el audio");
        toast.error("Error al reproducir el audio");
      };
    }
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, []);

  // Procesar el audio grabado
  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      toast.loading("Procesando audio...");
      const result = await assemblyAIService.transcribeAudio(audioBlob);
      
      if (result.success) {
        setTranscript(result.text);
        toast.success("Transcripción completada");
      } else {
        setError(result.error || 'Error al procesar el audio');
        toast.error(result.error || 'Error al procesar el audio');
        setTranscript('');
      }
    } catch (err) {
      console.error("❌ Excepción durante el procesamiento:", err);
      setError(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar/detener la grabación
  const toggleRecording = () => {
    if (!mediaRecorderRef.current) {
      setError('El grabador de audio no está listo');
      toast.error('El grabador de audio no está listo');
      return;
    }
    
    if (isRecording) {
      mediaRecorderRef.current.stop();
      toast.info("Grabación detenida");
    } else {
      setTranscript('');
      setError(null);
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      toast.info("Grabación iniciada");
    }
    
    setIsRecording(!isRecording);
  };

  // Sintetizar voz
  const handleTestVoice = async () => {
    try {
      setError(null);
      
      // Preprocesar texto para mejorar la naturalidad
      let processedText = testText;
      
      if (useBreathingMarkers) {
        // Añadir respiraciones naturales después de comas, puntos, etc.
        processedText = processedText.replace(/([.!?])\s+/g, '$1 <break time="500ms"/> ');
        processedText = processedText.replace(/([,;:])\s+/g, '$1 <break time="300ms"/> ');
      }
      
      // Optimizamos palabras técnicas para mejor pronunciación
      processedText = processedText.replace(/\bLLM\b/g, 'L L M');
      processedText = processedText.replace(/\bSLM\b/g, 'S L M');
      processedText = processedText.replace(/\bIA\b/g, 'I A');
      
      // Aquí iría la llamada a la API de síntesis de voz
      // Por ahora simulamos con un retardo
      toast.loading("Sintetizando voz...");
      
      // Simulamos la llamada a la API (esto se reemplazaría con la llamada real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulamos la reproducción de audio
      if (audioRef.current) {
        // En implementación real: 
        // 1. Se enviaría el texto a la API de ElevenLabs
        // 2. Se recibiría un blob de audio
        // 3. Se crearía una URL del blob
        // 4. Se asignaría la URL al src del elemento audio
        
        // Por ahora usamos un ejemplo de audio para pruebas
        audioRef.current.src = "/example-audio.mp3"; // Asume que existe este archivo
        await audioRef.current.play();
        toast.success("Síntesis de voz iniciada");
      }
    } catch (err) {
      console.error('Error al sintetizar voz:', err);
      setError(`Error al sintetizar voz: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Error al sintetizar voz: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Detener la reproducción de voz
  const handleStopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      toast.info("Reproducción detenida");
    }
  };

  return (
    <Layout title="LIA - Página de Pruebas" subtitle="Validación de componentes y servicios">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Página de Pruebas</h1>
        <p className="text-gray-600">
          Utiliza esta página para probar los diferentes componentes y servicios antes de integrarlos en la aplicación principal.
        </p>

        <Tabs defaultValue="voice">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice">Síntesis de Voz</TabsTrigger>
            <TabsTrigger value="recognition">Reconocimiento de Voz</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizaciones</TabsTrigger>
          </TabsList>
          
          {/* Pestaña de Síntesis de Voz */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Prueba de Síntesis de Voz</CardTitle>
                <CardDescription>
                  Prueba la síntesis de voz con ElevenLabs utilizando diferentes configuraciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="test-text" className="text-sm font-medium text-gray-700">
                      Texto para sintetizar:
                    </label>
                    <textarea
                      id="test-text"
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      className="w-full min-h-24 p-2 border rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Estabilidad: {stability}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={stability}
                        onChange={(e) => setStability(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Valores más bajos producen más variación en la voz.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Similitud: {similarityBoost}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={similarityBoost}
                        onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Controla la fidelidad a la voz original.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Estilo: {style}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={style}
                        onChange={(e) => setStyle(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Valores más altos producen más estilo y expresividad.
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="breathing-markers"
                        checked={useBreathingMarkers}
                        onChange={(e) => setUseBreathingMarkers(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="breathing-markers" className="text-sm font-medium text-gray-700">
                        Usar marcadores de respiración
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">
                      Estado: {isSpeaking ? 'Hablando' : 'En espera'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={handleTestVoice}
                  disabled={isSpeaking}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  Probar Síntesis de Voz
                </Button>
                
                <Button 
                  onClick={handleStopVoice}
                  disabled={!isSpeaking}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <VolumeX className="h-4 w-4" />
                  Detener
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Pestaña de Reconocimiento de Voz */}
          <TabsContent value="recognition">
            <Card>
              <CardHeader>
                <CardTitle>Prueba de Reconocimiento de Voz</CardTitle>
                <CardDescription>
                  Prueba el reconocimiento de voz con AssemblyAI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-gray-50 min-h-24">
                    <p className="font-medium">Transcripción:</p>
                    <p className="mt-2">{transcript || 'Habla para ver la transcripción aquí...'}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <button
                      onClick={toggleRecording}
                      disabled={isProcessing}
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
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      <p>{error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-gray-600">
                  <p>Hable claramente en su micrófono para probar el reconocimiento de voz.</p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Pestaña de Visualizaciones */}
          <TabsContent value="visualizations">
            <Card>
              <CardHeader>
                <CardTitle>Prueba de Visualizaciones</CardTitle>
                <CardDescription>
                  Visualiza los diferentes componentes visuales utilizados en la aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tabla LLM vs SLM</h3>
                    <LLMvsSLMTable />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-gray-600">
                  <p>Esta tabla se usará durante la presentación para mostrar las diferencias entre los modelos.</p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}