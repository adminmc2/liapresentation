'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mic, Volume2, VolumeX, ChevronRight, AlertCircle } from 'lucide-react';

import Layout from '@/components/Layout';
import ChatInterface from '@/components/ChatInterface';
import VisualizationComponent from '@/components/VisualizationComponent';
import { scriptManager } from '@/lib/services/enhanced-script-manager';
import { ScriptSegment } from '@/lib/data/script-data';
import { VoiceRecognition } from '@/components/ui/voice-recognition';
import { VoiceSynthesis } from '@/components/ui/voice-synthesis';

export default function LIAPresentation() {
  // Estados principales
  const [currentSegment, setCurrentSegment] = useState<ScriptSegment | null>(
    scriptManager.getCurrentSegment()
  );
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [showVisualization, setShowVisualization] = useState<boolean>(false);
  const [isLIASpeaking, setIsLIASpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Estado adicional para mejorar la experiencia de usuario
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'waiting'>('idle');
  const [isReady, setIsReady] = useState<boolean>(false);

  // Función para mapear visualType del script a VisualizationType del componente
  const mapVisualizationType = (type?: 'image' | 'table' | 'react') => {
    if (type === 'image') return 'image';
    if (type === 'table') return 'table';
    if (type === 'react') return 'chart'; // Mapeamos 'react' a 'chart'
    return 'none';
  };

  // Actualizar el estado cuando cambia el segmento del guión
  useEffect(() => {
    const unsubscribe = scriptManager.subscribe(state => {
      const segment = scriptManager.getCurrentSegment();
      setCurrentSegment(segment);
      
      // Si el segmento actual es de LIA, preparar la respuesta
      if (segment && segment.speaker === 'LIA') {
        addMessage('assistant', segment.text);
        setShowVisualization(!!segment.visualType && !!segment.visualContent);
        setStatus('speaking');
      } else if (segment && segment.speaker === 'Armando') {
        // Si es turno del presentador, cambiar estado a espera
        setStatus('waiting');
        setShowVisualization(!!segment.visualType && !!segment.visualContent);
      } else {
        setShowVisualization(false);
        setStatus('idle');
      }
    });
    
    // Comprobar si ya tenemos un segmento inicial
    if (currentSegment) {
      setIsReady(true);
      
      // Inicializar con el segmento actual si existe
      if (currentSegment.speaker === 'LIA') {
        addMessage('assistant', currentSegment.text);
        setShowVisualization(!!currentSegment.visualType && !!currentSegment.visualContent);
      }
    }
    
    return unsubscribe;
  }, []);

  // Función para añadir un mensaje al historial de chat
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [
      ...prev, 
      {
        id: Date.now().toString(),
        role,
        content,
        timestamp: new Date()
      }
    ]);
  };

  // Manejar el resultado del reconocimiento de voz
  const handleVoiceResult = (text: string) => {
    console.log('Texto reconocido:', text);
    
    // Añadir el mensaje del usuario al chat
    addMessage('user', text);
    
    // Si el segmento actual es de Armando, avanzar al siguiente segmento
    const segment = scriptManager.getCurrentSegment();
    if (segment && segment.speaker === 'Armando') {
      // Pequeña demora para simular procesamiento natural
      setStatus('processing');
      
      setTimeout(() => {
        scriptManager.nextSegment();
      }, 800);
    }
  };

  // Manejar la coincidencia de segmentos
  const handleSegmentMatch = (segmentId: string, confidence: number) => {
    console.log(`Coincidencia con segmento ${segmentId} (confianza: ${confidence})`);
    
    // Solo avanzamos si hay alta confianza
    if (confidence > 0.7) {
      scriptManager.goToSegmentById(segmentId);
    }
  };
  
  // Manejar cuando LIA termina de hablar
  const handleLIASpeechEnd = () => {
    setIsLIASpeaking(false);
    setStatus('waiting');
    
    // Si el segmento actual es de LIA, avanzar automáticamente al siguiente
    const segment = scriptManager.getCurrentSegment();
    if (segment && segment.speaker === 'LIA') {
      // Dar tiempo para que el usuario asimile lo que dijo LIA antes de avanzar
      setTimeout(() => {
        scriptManager.nextSegment();
      }, 1500);
    }
  };

  // Función para determinar si mostrar controles de reconocimiento de voz
  const shouldShowVoiceControls = () => {
    return currentSegment && currentSegment.speaker === 'Armando';
  };

  // Iniciar el reconocimiento de voz
  const handleStartListening = () => {
    setStatus('listening');
    // La lógica real se maneja en el componente VoiceRecognition
  };
  
  // Avanzar manualmente (sistema de respaldo)
  const handleManualAdvance = () => {
    toast.info('Avanzando manualmente');
    scriptManager.nextSegment();
  };
  
  // Repetir segmento actual (sistema de respaldo)
  const handleRepeatSegment = () => {
    const segment = scriptManager.getCurrentSegment();
    if (segment) {
      toast.info('Repitiendo segmento actual');
      
      if (segment.speaker === 'LIA') {
        // Si es LIA, volver a reproducir la voz
        setIsLIASpeaking(true);
        setStatus('speaking');
      } else {
        // Si es Armando, simplemente esperar nuevo input
        setStatus('waiting');
      }
    }
  };
  
  // Alternar silencio
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Audio activado' : 'Audio silenciado');
    // Aquí iría la lógica real para silenciar la síntesis de voz
  };
  
  // Iniciar la presentación
  const handleStartPresentation = () => {
    toast.success('¡Presentación iniciada!');
    setIsReady(true);
    scriptManager.start();
  };

  // Definir el fondo principal
  const mainBackground = 'bg-gradient-radial from-white via-[rgba(245,245,255,0.8)] to-[rgba(240,240,250,0.6)]';

  return (
    <Layout 
      showFooter={false}
      backgroundColor={mainBackground}
      headerSize="md"
    >
      {!isReady ? (
        // Pantalla de inicio
        <motion.div 
          className="flex flex-col items-center justify-center h-[70vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="w-24 h-24 mb-8 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.9) 0%, rgba(242, 240, 253, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 8px 15px rgba(0, 0, 0, 0.05)'
            }}
          >
            <span className="text-4xl font-bold text-gray-700">LIA</span>
          </div>

          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-bold mb-2 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(244, 114, 182, 0.9) 0%, rgba(165, 180, 252, 0.9) 100%)'
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              La Inteligencia Asertiva
            </motion.h1>
            <motion.p 
              className="text-gray-600 max-w-md mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Asistente de IA para la Conferencia de Profesores de Español en Polonia
            </motion.p>
          </div>
          
          <motion.button
            onClick={handleStartPresentation}
            className="px-6 py-3 text-white rounded-full shadow-lg transition-all flex items-center space-x-2"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.8) 0%, rgba(165, 180, 252, 0.8) 100%)',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" 
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span>Iniciar Presentación</span>
            <ChevronRight className="h-5 w-5" />
          </motion.button>
          
          <motion.div 
            className="mt-12 text-sm text-gray-500 p-5 rounded-xl max-w-lg"
            style={{ 
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(244, 114, 182, 0.1)'
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="mb-2">
                  Asegúrate de que tu micrófono esté funcionando correctamente antes de comenzar.
                </p>
                <p>
                  Esta presentación utiliza reconocimiento de voz y síntesis de voz para crear una experiencia interactiva.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Interfaz principal de la presentación
        <div className="w-full h-full flex flex-col">
          {/* Contenido principal con diseño de dos columnas */}
          <div className="flex flex-1 gap-4 h-full">
            {/* Área de chat - Lado izquierdo (30% del ancho) */}
            <motion.div 
              className="w-3/10"
              style={{ width: '30%' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ChatInterface 
                initialMessages={messages}
                status={status}
                onMicrophoneClick={handleStartListening}
                onManualAdvance={handleManualAdvance}
                onRepeatSegment={handleRepeatSegment}
                speakerName={{ user: 'Armando', assistant: 'LIA' }}
                className="shadow-lg border border-pink-100/30 h-full"
              />
              
              {/* Controles de voz - Solo visibles cuando es necesario */}
              {shouldShowVoiceControls() && (
                <motion.div 
                  className="absolute bottom-20 left-1/4 transform -translate-x-1/2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <VoiceRecognition 
                    onResult={handleVoiceResult} 
                    onSegmentMatch={handleSegmentMatch}
                  />
                </motion.div>
              )}
              
              {/* Síntesis de voz (oculta) */}
              {currentSegment?.speaker === 'LIA' && currentSegment.responseVoice && (
                <div className="hidden">
                  <VoiceSynthesis 
                    text={currentSegment.text}
                    autoPlay={true}
                    stability={0.35}
                    similarityBoost={0.75}
                    style={0.2}
                    onPlayStart={() => {
                      setIsLIASpeaking(true);
                      setStatus('speaking');
                    }}
                    onPlayEnd={handleLIASpeechEnd}
                    showControls={false}
                  />
                </div>
              )}
            </motion.div>
            
            {/* Área de visualización - Lado derecho */}
            <motion.div 
              className="w-1/2 h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div 
                className="rounded-xl p-6 h-full flex items-center justify-center"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  border: '1px solid rgba(244, 114, 182, 0.1)'
                }}
              >
                {showVisualization && currentSegment ? (
                  <VisualizationComponent 
                    type={mapVisualizationType(currentSegment.visualType)}
                    content={{
                      type: currentSegment.visualContent,
                      title: `Visualización para ${currentSegment.id}`,
                      text: currentSegment.text,
                      src: currentSegment.visualContent
                    }}
                    alt={`Visualización para ${currentSegment.id}`}
                    showAnimation={true}
                  />
                ) : (
                  <VisualizationComponent 
                    showAnimation={false}
                  />
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Controles discretos en la parte inferior derecha */}
          <motion.div 
            className="absolute bottom-4 right-8 flex space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={handleManualAdvance}
              className="px-3 py-1.5 rounded-lg text-xs flex items-center transition-all duration-200 opacity-60 hover:opacity-100"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(244, 114, 182, 0.2)',
                color: 'rgba(219, 39, 119, 0.8)'
              }}
            >
              <ChevronRight className="h-3 w-3 mr-1" />
              Avanzar
            </button>
            <button
              onClick={() => scriptManager.previousSegment()}
              className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200 opacity-60 hover:opacity-100"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(244, 114, 182, 0.2)',
                color: 'rgba(219, 39, 119, 0.8)'
              }}
            >
              Retroceder
            </button>
            <button
              onClick={handleToggleMute}
              className="px-3 py-1.5 rounded-lg text-xs flex items-center transition-all duration-200 opacity-60 hover:opacity-100"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(244, 114, 182, 0.2)',
                color: 'rgba(219, 39, 119, 0.8)'
              }}
            >
              {isMuted ? <VolumeX className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
              {isMuted ? "Activar sonido" : "Silenciar"}
            </button>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}