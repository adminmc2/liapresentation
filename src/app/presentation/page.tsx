'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// Añade esta línea para definir temporalmente el tipo VisualizationType
// @ts-ignore - Definición temporal de tipo para evitar errores
type VisualizationType = 'image' | 'table' | 'chart' | 'text' | 'loading' | 'none';

// Definimos una interfaz para visualizaciones
interface Visualization {
  type: string; // 'image' | 'table' | 'react' | 'text' | 'loading' | 'none'
  content: any;
  isPersistent?: boolean;
}

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
  
  // Nuevo estado para visualizaciones
  const [currentVisualization, setCurrentVisualization] = useState<Visualization | null>(null);
  const [defaultVisualization, setDefaultVisualization] = useState<Visualization | null>(null);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('');

  // Estados para manejar la pantalla de bienvenida
  const [welcomeStep, setWelcomeStep] = useState<'initial' | 'hostSpeaking' | 'complete'>('initial');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(false);

  // Función para mapear visualType del script a VisualizationType del componente
  // @ts-ignore - Ignoramos errores de tipo
  const mapVisualizationType = (type?: string): string => {
    if (type === 'image') return 'image';
    if (type === 'table') return 'table';
    if (type === 'react') return 'chart'; // Mapeamos 'react' a 'chart'
    if (type === 'text') return 'text';   // Añadimos soporte para text
    return 'none';
  };

  // Actualizar el estado cuando cambia el segmento del guión
  useEffect(() => {
    // CAMBIO 1: Forzar estado inicial al cargar la página
    setIsReady(false);
    setWelcomeStep('initial');
    setShowWelcomeMessage(false);
    // FIN CAMBIO 1
    
    const unsubscribe = scriptManager.subscribe(state => {
      const segment = scriptManager.getCurrentSegment();
      setCurrentSegment(segment);
      
      // Si el segmento actual es de LIA, preparar la respuesta
      if (segment && segment.speaker === 'LIA') {
        addMessage('assistant', segment.text);
        
        // Configurar visualización si existe
        if (segment.visualType && segment.visualContent) {
          setShowVisualization(true);
          const newVisualization: Visualization = {
            type: mapVisualizationType(segment.visualType),
            content: segment.visualType === 'text' ? {
              type: 'text',
              title: segment.visualContent.includes('<h1') ? '' : `Visualización para ${segment.id}`,
              text: segment.visualContent,
            } : {
              type: segment.visualContent,
              title: `Visualización para ${segment.id}`,
              text: segment.text,
              src: segment.visualContent
            },
            isPersistent: !!segment.visualPersist
          };
          setCurrentVisualization(newVisualization);
        } else {
          setShowVisualization(false);
          setCurrentVisualization(null);
        }
        
        setStatus('speaking');
      } else if (segment && segment.speaker === 'Armando') {
        // Si es turno del presentador, cambiar estado a espera
        setStatus('waiting');
        
        // Manejar la escena 0 especial (bienvenida)
        if (segment.scene === 0 && segment.id === 'escena0-armando-bienvenida') {
          setWelcomeStep('hostSpeaking');
          addMessage('user', segment.text);
          
          // Configurar visualización de bienvenida
          if (segment.visualType && segment.visualContent) {
            setShowVisualization(true);
            const welcomeVisualization: Visualization = {
              type: mapVisualizationType(segment.visualType),
              content: segment.visualType === 'text' ? {
                type: 'text',
                text: segment.visualContent,
              } : {
                type: segment.visualContent,
                title: 'Bienvenida',
                text: segment.text,
                src: segment.visualContent
              },
              isPersistent: false
            };
            setCurrentVisualization(welcomeVisualization);
            setShowWelcomeMessage(true);
          }
        } else {
          setWelcomeStep('complete');
          
          // Mantener visualización si existe
          if (segment.visualType && segment.visualContent) {
            setShowVisualization(true);
            const newVisualization: Visualization = {
              type: mapVisualizationType(segment.visualType),
              content: segment.visualType === 'text' ? {
                type: 'text',
                title: segment.visualContent.includes('<h1') ? '' : `Visualización para ${segment.id}`,
                text: segment.visualContent,
              } : {
                type: segment.visualContent,
                title: `Visualización para ${segment.id}`,
                text: segment.text,
                src: segment.visualContent
              },
              isPersistent: !!segment.visualPersist
            };
            setCurrentVisualization(newVisualization);
          }
        }
      } else {
        setShowVisualization(false);
        setCurrentVisualization(null);
        setStatus('idle');
      }
    });
    
    // Comprobar si ya tenemos un segmento inicial
    if (currentSegment) {
      // CAMBIO 2: Comentar o eliminar esta línea
      // setIsReady(true);  // COMENTADO para evitar que se muestre la interfaz directamente
      
      // Inicializar con el segmento actual si existe
      if (currentSegment.speaker === 'LIA') {
        addMessage('assistant', currentSegment.text);
        
        if (currentSegment.visualType && currentSegment.visualContent) {
          setShowVisualization(true);
          const initialVisualization: Visualization = {
            type: mapVisualizationType(currentSegment.visualType),
            content: currentSegment.visualType === 'text' ? {
              type: 'text',
              title: currentSegment.visualContent.includes('<h1') ? '' : `Visualización para ${currentSegment.id}`,
              text: currentSegment.visualContent,
            } : {
              type: currentSegment.visualContent,
              title: `Visualización para ${currentSegment.id}`,
              text: currentSegment.text,
              src: currentSegment.visualContent
            },
            isPersistent: !!currentSegment.visualPersist
          };
          setCurrentVisualization(initialVisualization);
        }
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
    
    // Caso especial para el paso de bienvenida
    if (welcomeStep === 'hostSpeaking') {
      setWelcomeStep('complete');
      toast.success('¡Bienvenida completada!');
      
      // Avanzar al siguiente segmento después de un breve retraso
      setTimeout(() => {
        scriptManager.nextSegment();
      }, 1500);
      
      return;
    }
    
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
  
  // Manejar actualizaciones del texto hablado
  const handleSpeechTextUpdate = (text: string, isComplete: boolean) => {
    setCurrentSpeechText(text);
    
    // Podríamos usar esto para actualizar visualizaciones o mostrar subtítulos
    console.log("Texto actual:", text.length > 50 ? text.substring(0, 50) + "..." : text);
  };
  
  // Manejar cambios en visualizaciones
  const handleVisualizationChange = (visualization: Visualization | null) => {
    // Podemos usar esto para sincronizar visualizaciones con otros componentes
    console.log("Visualización cambiada:", visualization?.type);
  };

  // Función para determinar si mostrar controles de reconocimiento de voz
  const shouldShowVoiceControls = () => {
    return (
      (currentSegment && currentSegment.speaker === 'Armando') ||
      welcomeStep === 'hostSpeaking'
    );
  };

  // Iniciar el reconocimiento de voz
  const handleStartListening = () => {
    setStatus('listening');
    // La lógica real se maneja en el componente VoiceRecognition
  };
  
  // Avanzar manualmente (sistema de respaldo)
  const handleManualAdvance = () => {
    // Si estamos en el paso de bienvenida del presentador
    if (welcomeStep === 'hostSpeaking') {
      setWelcomeStep('complete');
      toast.success('Avanzando a la presentación principal');
      setTimeout(() => {
        scriptManager.nextSegment();
      }, 800);
      return;
    }
    
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
  
  // CAMBIO 3: Mejorar la función handleStartPresentation con logs
  const handleStartPresentation = () => {
    toast.success('¡Presentación iniciada!');
    setIsReady(true);
    
    // Agregar logs para depuración
    console.log('Iniciando presentación...');
    
    // Asegurarse de que comenzamos con la escena de bienvenida (escena 0)
    const welcomeSegment = scriptManager.start();
    console.log('Segmento inicial:', welcomeSegment);
    
    // Verificar si el primer segmento es la bienvenida (escena 0)
    if (welcomeSegment && welcomeSegment.scene === 0) {
      // Ya estamos en el segmento correcto, continuar
      setWelcomeStep('hostSpeaking');
      console.log('Estableciendo paso de bienvenida: hostSpeaking');
    } else {
      // Buscar el segmento de bienvenida por ID y navegar a él
      console.log('Navegando manualmente a escena0-armando-bienvenida');
      scriptManager.goToSegmentById('escena0-armando-bienvenida');
      setWelcomeStep('hostSpeaking');
    }
  };

  // CAMBIO 4: Agregar función de reinicio para pruebas
  const handleReset = () => {
    setIsReady(false);
    setWelcomeStep('initial');
    setCurrentSegment(null);
    setMessages([]);
    setShowWelcomeMessage(false);
    setShowVisualization(false);
    setCurrentVisualization(null);
    toast.info('Estado reiniciado');
  };

  // Definir el fondo principal
  const mainBackground = 'bg-gradient-radial from-white via-[rgba(245,245,255,0.8)] to-[rgba(240,240,250,0.6)]';

  // Función para inyectar el script que ocultará elementos específicos del header sin eliminar el header
  // y establecer el header como fijo en la parte superior
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = `
      /* Ocultar elementos específicos del header sin eliminarlo */
      header .size-4, /* Logo OpenAI */
      header .font-bold.text-primary, /* Texto "Chatbot..." */
      header a[href*="github.com"] /* Botón GitHub */
      { 
        display: none !important; 
      }
      
      /* Reset completo para eliminar cualquier espacio antes del header */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Hacer que el header sea completamente fijo en la parte superior */
      header.sticky, 
      header.top-0,
      header {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        margin: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        width: 100% !important;
        z-index: 9999 !important;
      }
      
      /* Asegurar que no hay ningún elemento antes del header */
      #__next > *, 
      [data-nextjs-root] > *,
      main > *:first-child,
      body > *:first-child {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      
      /* Ajustar el contenido principal para evitar que quede debajo del header */
      main {
        padding-top: 4rem !important; /* Ajusta este valor según la altura de tu header */
      }
      
      /* Eliminar cualquier espacio adicional en componentes principales */
      div[class*="Layout"], 
      div[class*="Container"] {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
    `;
    
    // Añadir el estilo al head del documento
    document.head.appendChild(styleElement);
    
    // Asegurar que no hay espacio antes del header haciendo scroll al inicio
    window.scrollTo(0, 0);
    
    // También podemos intentar mover el header programáticamente al inicio del DOM si es necesario
    setTimeout(() => {
      const header = document.querySelector('header');
      const body = document.body;
      
      if (header && body && body.firstChild !== header) {
        // Intentamos mover el header al principio del body si no está ahí ya
        body.insertBefore(header, body.firstChild);
      }
    }, 100);
    
    // Limpieza al desmontar el componente
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      <Layout 
        showHeader={true}  // Mantenemos el header visible
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
              <span className="text-4xl font-bold text-gray-700"></span>
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
                Comunicando con GracIA-LIA
              </motion.h1>
              <motion.p 
                className="text-gray-600 max-w-md mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Agentes de IA para el aprendizaje ELE
              </motion.p>
              <motion.p 
                className="text-gray-500 mt-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                Praga 2025
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
                {/* Mostrar mensaje de bienvenida si estamos en ese paso */}
                {welcomeStep === 'hostSpeaking' && (
                  <motion.div 
                    className="bg-pink-50 p-4 mb-4 rounded-lg shadow border border-pink-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-pink-800 font-medium">Tu turno de hablar:</p>
                    <p className="text-gray-700 mt-1 text-sm">
                      "Muchas gracias por estar con nosotros aquí en Praga, es siempre un placer estar aquí en este espacio creado por nosotros."
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleManualAdvance}
                        className="px-3 py-1 text-xs bg-pink-600 text-white rounded-full hover:bg-pink-700 flex items-center"
                      >
                        <span>Continuar</span>
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </motion.div>
                )}

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
                
                {/* Síntesis de voz con componente mejorado */}
                {currentSegment?.speaker === 'LIA' && currentSegment.responseVoice && (
                  <div className="hidden">
                    <VoiceSynthesis 
                      text={currentSegment.text}
                      autoPlay={true}
                      stability={0.35}
                      similarityBoost={0.75}
                      style={0.2}
                      // @ts-ignore - Ignoramos errores de TypeScript para las props no soportadas
                      trackSpeechProgress={true}
                      onTextUpdate={handleSpeechTextUpdate}
                      currentVisualization={currentVisualization}
                      defaultVisualization={defaultVisualization}
                      onVisualizationChange={handleVisualizationChange}
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
                  {/* Si estamos en el paso de bienvenida, mostrar la visualización especial */}
                  {welcomeStep === 'hostSpeaking' && showWelcomeMessage ? (
                    <VisualizationComponent 
                      // @ts-ignore - Necesario para evitar error de tipo con "text"
                      type="text"
                      content={{
                        text: '<h1 class="text-3xl font-bold text-center text-gray-800 mb-4">BIENVENIDOS Y BIENVENIDAS</h1><p class="text-xl text-center text-gray-600">¡Gracias por estar con nosotros!</p>'
                      }}
                      alt="Mensaje de bienvenida"
                      showAnimation={true}
                    />
                  ) : (
                    // Para otros casos, usar la visualización normal
                    showVisualization && currentSegment ? (
                      <VisualizationComponent 
                        // @ts-ignore - Necesario para evitar error de tipo con el resultado de mapVisualizationType
                        type={mapVisualizationType(currentSegment.visualType)}
                        content={
                          currentSegment.visualType === 'text' ? 
                          {
                            type: 'text',
                            text: currentSegment.visualContent
                          } : 
                          {
                            type: currentSegment.visualContent,
                            title: `Visualización para ${currentSegment.id}`,
                            text: currentSegment.text,
                            src: currentSegment.visualContent
                          }
                        }
                        alt={`Visualización para ${currentSegment.id}`}
                        showAnimation={true}
                      />
                    ) : (
                      <VisualizationComponent 
                        showAnimation={false}
                      />
                    )
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* Subtítulos de voz en tiempo real (opcional) */}
            {isLIASpeaking && currentSpeechText && (
              <motion.div 
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-xl w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="bg-black bg-opacity-50 text-white p-3 rounded-lg text-center"
                  style={{
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  {currentSpeechText}
                </div>
              </motion.div>
            )}
            
            {/* Icono de micrófono especial para el paso de bienvenida */}
            {welcomeStep === 'hostSpeaking' && (
              <motion.div
                className="absolute bottom-36 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleStartListening}
                  className="w-16 h-16 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg hover:bg-pink-600 transition-all"
                  style={{
                    boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  <Mic className="h-6 w-6" />
                </button>
                <p className="mt-2 text-center text-sm text-pink-600 font-medium">
                  Haz clic para hablar
                </p>
              </motion.div>
            )}
            
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
    </>
  );
}