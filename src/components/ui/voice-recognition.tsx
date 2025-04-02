'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { assemblyAIService } from '@/lib/services/assemblyai-service';
import { scriptManager } from '@/lib/services/enhanced-script-manager';

interface VoiceRecognitionProps {
  onResult?: (text: string) => void;
  onSegmentMatch?: (segmentId: string, confidence: number) => void;
  buttonSize?: 'sm' | 'md' | 'lg';
  showTranscript?: boolean;
  className?: string;
  variant?: 'default' | 'minimal';
}

export const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({ 
  onResult, 
  onSegmentMatch,
  buttonSize = 'md',
  showTranscript = true,
  className = '',
  variant = 'default'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Tamaños de botón según la prop
  const buttonSizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }[buttonSize];
  
  const iconSizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[buttonSize];

  // Verificar soporte del navegador
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsBrowserSupported(false);
      setError('Tu navegador no soporta grabación de audio');
      toast.error('Tu navegador no soporta grabación de audio');
    }
  }, []);

  // Inicializar el grabador de audio
  useEffect(() => {
    if (!isBrowserSupported) return;
    
    const setupMediaRecorder = async () => {
      try {
        console.log('Solicitando permisos de micrófono...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        console.log('Permisos concedidos, configurando MediaRecorder');
        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') 
            ? 'audio/webm' 
            : 'audio/mp4'
        });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          if (audioChunksRef.current.length === 0) {
            setError('No se capturó audio. Intenta hablar más fuerte.');
            return;
          }
          
          const blob = new Blob(audioChunksRef.current, { 
            type: recorder.mimeType 
          });
          audioChunksRef.current = [];
          await processAudio(blob);
        };
        
        recorder.onerror = (event) => {
          console.error('Error en MediaRecorder:', event);
          setError('Error al grabar audio');
          setIsListening(false);
          toast.error('Error al grabar audio');
        };
        
        mediaRecorderRef.current = recorder;
        console.log('MediaRecorder configurado correctamente');
      } catch (err) {
        console.error('Error al acceder al micrófono:', err);
        setError(`No se pudo acceder al micrófono: ${err instanceof Error ? err.message : String(err)}`);
        toast.error('No se pudo acceder al micrófono');
      }
    };
    
    setupMediaRecorder();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isBrowserSupported]);

  // Procesar el audio cuando se detiene la grabación
  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Usar el servicio de AssemblyAI para transcribir
      const result = await assemblyAIService.transcribeAudio(blob);
      
      if (result.success && result.text) {
        setTranscript(result.text);
        
        if (onResult) {
          onResult(result.text);
        }
        
        // Buscar coincidencia con segmentos basado en palabras clave
        const match = scriptManager.findSegmentByKeywords(result.text);
        if (match && onSegmentMatch) {
          onSegmentMatch(match.segment.id, match.confidence);
          
          if (match.confidence > 0.8) {
            toast.success('¡Coincidencia perfecta detectada!');
          } else if (match.confidence > 0.6) {
            toast.info('Coincidencia detectada');
          }
        }
      } else {
        console.error('Error al transcribir:', result.error);
        setError('No se pudo reconocer el audio. Intenta de nuevo.');
        toast.error('No se pudo reconocer el audio');
      }
    } catch (error) {
      console.error('Error al procesar el audio:', error);
      setError('Error al procesar el audio. Intenta de nuevo.');
      toast.error('Error al procesar el audio');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar/detener la grabación
  const toggleListening = () => {
    if (!mediaRecorderRef.current || !isBrowserSupported) return;
    
    if (isListening) {
      mediaRecorderRef.current.stop();
      toast.info('Grabación detenida');
      setIsListening(false);
    } else {
      setTranscript('');
      setError(null);
      audioChunksRef.current = [];
      
      try {
        mediaRecorderRef.current.start();
        toast.info('Grabación iniciada');
        setIsListening(true);
      } catch (err) {
        console.error('Error al iniciar grabación:', err);
        setError('Error al iniciar grabación');
        toast.error('Error al iniciar grabación');
      }
    }
  };

  // Renderizado del botón según variante
  const renderButton = () => {
    if (variant === 'minimal') {
      return (
        <button
          onClick={toggleListening}
          disabled={!isBrowserSupported || !mediaRecorderRef.current || isProcessing}
          className={`${buttonSizeClass} rounded-full flex items-center justify-center transition-colors ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : isProcessing
              ? 'bg-yellow-500'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white disabled:bg-gray-300 disabled:cursor-not-allowed`}
          aria-label={isListening ? "Detener grabación" : "Iniciar grabación"}
          title={isListening ? "Detener grabación" : "Iniciar grabación"}
        >
          {isListening ? (
            <Square className={iconSizeClass} />
          ) : isProcessing ? (
            <Loader2 className={`${iconSizeClass} animate-spin`} />
          ) : (
            <Mic className={iconSizeClass} />
          )}
        </button>
      );
    }
    
    return (
      <button
        onClick={toggleListening}
        disabled={!isBrowserSupported || !mediaRecorderRef.current || isProcessing}
        className={`${buttonSizeClass} rounded-full flex items-center justify-center transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : isProcessing
            ? 'bg-yellow-500'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
        aria-label={isListening ? "Detener grabación" : "Iniciar grabación"}
        title={isListening ? "Detener grabación" : "Iniciar grabación"}
      >
        {isListening ? (
          <Square className={iconSizeClass} />
        ) : isProcessing ? (
          <Loader2 className={`${iconSizeClass} animate-spin`} />
        ) : (
          <Mic className={iconSizeClass} />
        )}
      </button>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {renderButton()}
      
      {!isBrowserSupported && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md w-full max-w-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">Tu navegador no soporta grabación de audio</span>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md w-full max-w-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      
      {showTranscript && transcript && (
        <div className="mt-2 p-2 bg-gray-100 rounded-md w-full max-w-md">
          <p className="text-sm text-gray-800">{transcript}</p>
        </div>
      )}
      
      {isListening && (
        <div className="mt-2 flex items-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></div>
          </div>
          <span className="ml-2 text-xs text-gray-500">Escuchando...</span>
        </div>
      )}
    </div>
  );
};