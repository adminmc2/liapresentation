'use client';

import React, { useState, useEffect } from 'react';
import { ScriptViewer } from './script/script-viewer';
import { ScriptTracker } from './script/script-tracker';
import { VoiceRecognition } from '@/components/ui/voice-recognition';
import { VoiceSynthesis } from '@/components/ui/voice-synthesis';
import { Visualization } from '@/components/ui/visualization';
import { scriptManager } from '@/lib/services/script-manager';
import { ScriptSegment } from '@/lib/data/script-data';

export const LIAPresentation: React.FC = () => {
  const [currentSegment, setCurrentSegment] = useState<ScriptSegment | null>(
    scriptManager.getCurrentSegment()
  );
  const [responseText, setResponseText] = useState<string>('');
  const [showVisualization, setShowVisualization] = useState<boolean>(false);
  const [isLIASpeaking, setIsLIASpeaking] = useState<boolean>(false);

  // Actualizar el estado cuando cambia el segmento del guión
  useEffect(() => {
    const unsubscribe = scriptManager.subscribe(state => {
      const segment = scriptManager.getCurrentSegment();
      setCurrentSegment(segment);
      
      // Si el segmento actual es de LIA, preparar la respuesta
      if (segment && segment.speaker === 'LIA') {
        setResponseText(segment.text);
        setShowVisualization(!!segment.visualType && !!segment.visualContent);
      } else {
        setResponseText('');
        setShowVisualization(false);
      }
    });
    
    return unsubscribe;
  }, []);

  // Manejar el resultado del reconocimiento de voz con más automatización
  const handleVoiceResult = (text: string) => {
    console.log('Texto reconocido:', text);
    
    // Si el segmento actual es de Armando, avanzar automáticamente al siguiente segmento (LIA)
    const segment = scriptManager.getCurrentSegment();
    if (segment && segment.speaker === 'Armando') {
      // Pequeña demora para simular procesamiento natural
      setTimeout(() => {
        scriptManager.nextSegment();
      }, 800);
    }
  };

  // Manejar la coincidencia de segmentos con baja creatividad (0.2-0.3)
  const handleSegmentMatch = (segmentId: string, confidence: number) => {
    console.log(`Coincidencia con segmento ${segmentId} (confianza: ${confidence})`);
    
    // Con una creatividad baja (0.2-0.3), solo avanzamos si hay alta confianza
    if (confidence > 0.7) {
      scriptManager.goToSegmentById(segmentId);
    }
  };
  
  // Manejar cuando LIA termina de hablar
  const handleLIASpeechEnd = () => {
    setIsLIASpeaking(false);
    
    // Si el segmento actual es de LIA, podemos avanzar automáticamente al siguiente (Armando)
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

  return (
    <div className="flex flex-col gap-4 p-4 max-w-5xl mx-auto">
      {/* Solo en modo desarrollo, mostrar el panel de guión (oculto en producción) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full space-y-4 border-b pb-4 mb-4">
          <details>
            <summary className="cursor-pointer font-medium text-gray-600 mb-2">Panel de control (solo desarrollo)</summary>
            <div className="pl-4">
              <ScriptViewer onSegmentChange={setCurrentSegment} />
              <ScriptTracker />
            </div>
          </details>
        </div>
      )}
      
      {/* Área principal con visualización y conversación */}
      <div className="w-full flex flex-col space-y-6">
        {/* Área de visualización */}
        <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px] flex flex-col items-center justify-center">
          {showVisualization && currentSegment && (
            <Visualization 
              type={currentSegment.visualType} 
              content={currentSegment.visualContent}
              alt={`Visualización para ${currentSegment.id}`}
            />
          )}
          
          {!showVisualization && (
            <div className="text-center text-gray-400 italic">
              <p>Esperando contenido visual...</p>
            </div>
          )}
        </div>
        
        {/* Área de conversación */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium">Conversación</h3>
            
            {/* Indicador de estado */}
            {isLIASpeaking ? (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                LIA está hablando
              </span>
            ) : currentSegment?.speaker === 'Armando' ? (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Turno de Armando
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                En espera
              </span>
            )}
          </div>
          
          {currentSegment && (
            <div className={`p-4 rounded-lg mb-4 ${
              currentSegment.speaker === 'LIA' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'
            }`}>
              <div className="flex items-center mb-2">
                <span className={`font-medium text-lg ${
                  currentSegment.speaker === 'LIA' ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {currentSegment.speaker}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  Escena {currentSegment.scene}
                </span>
              </div>
              
              <p className="text-gray-800">{currentSegment.text}</p>
              
              {currentSegment.speaker === 'LIA' && currentSegment.responseVoice && (
                <div className="mt-3 flex justify-end">
                  <VoiceSynthesis 
                    text={currentSegment.text}
                    autoPlay={true} 
                    onPlayStart={() => setIsLIASpeaking(true)}
                    onPlayEnd={handleLIASpeechEnd}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Controles de voz para Armando */}
          <div className="flex justify-center mt-6">
            {shouldShowVoiceControls() ? (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">
                  {isLIASpeaking ? 
                    "LIA está hablando..." : 
                    "Haz clic en el micrófono para continuar"
                  }
                </p>
                <VoiceRecognition 
                  onResult={handleVoiceResult} 
                  onSegmentMatch={handleSegmentMatch} 
                />
              </div>
            ) : (
              <button 
                onClick={() => scriptManager.nextSegment()}
                className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center"
                title="Avanzar (solo modo desarrollo)"
                style={{ display: process.env.NODE_ENV === 'development' ? 'flex' : 'none' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};