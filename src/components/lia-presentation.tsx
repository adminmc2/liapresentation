'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Play, Pause, Volume2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { EnhancedElevenLabsService as ElevenLabsService } from '@/lib/services/enhanced-elevenlabs-service';

// Interfaz para visualizaciones con soporte para diferentes tipos
interface Visualization {
  type: string; // 'image' | 'table' | 'react' | 'text' | 'loading' | 'none'
  content: any;
  isPersistent?: boolean;
}

interface VoiceSynthesisProps {
  text: string;
  voiceId?: string;
  autoPlay?: boolean;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  showControls?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'text';
  showError?: boolean;
  className?: string;
  // Nuevos props para seguimiento de texto
  onTextUpdate?: (currentText: string, isComplete: boolean) => void;
  trackSpeechProgress?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
  // Nuevos props para visualizaciones
  currentVisualization?: Visualization | null;
  onVisualizationChange?: (visualization: Visualization | null) => void;
  defaultVisualization?: Visualization | null;
  disablePersistentVisualization?: boolean;
}

/**
 * Componente mejorado para síntesis de voz utilizando ElevenLabs
 */
export const VoiceSynthesis: React.FC<VoiceSynthesisProps> = ({
  text,
  voiceId = 'gD1IexrzCvsXPHUuT0s3', // ID por defecto de ElevenLabs
  autoPlay = false,
  stability = 0.5,
  similarityBoost = 0.75,
  style = 0,
  showControls = true,
  buttonSize = 'md',
  variant = 'default',
  showError = true,
  className = '',
  // Nuevos props
  onTextUpdate,
  trackSpeechProgress = false,
  onPlayStart,
  onPlayEnd,
  onError,
  // Props de visualización
  currentVisualization = null,
  onVisualizationChange,
  defaultVisualization = null,
  disablePersistentVisualization = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Para seguimiento de texto
  const [currentSpeechSegment, setCurrentSpeechSegment] = useState('');
  const textProgressRef = useRef(0);
  const textSegmentsRef = useRef<string[]>([]);
  const speechCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Para visualizaciones persistentes
  const [lastPersistentVisualization, setLastPersistentVisualization] = useState<Visualization | null>(null);
  const [activeVisualization, setActiveVisualization] = useState<Visualization | null>(null);
  const [isLoadingVisualization, setIsLoadingVisualization] = useState(false);

  // Tamaños de botón según la prop
  const buttonSizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[buttonSize];
  
  const iconSizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[buttonSize];
  
  // Determinar clases según la variante
  const getButtonClasses = () => {
    if (variant === 'minimal') {
      return `${buttonSizeClass} flex items-center justify-center rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;
    } else if (variant === 'text') {
      return `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;
    }
    return `${buttonSizeClass} flex items-center justify-center rounded-full shadow-sm text-white transition-colors hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`;
  };

  // Configuración para seguimiento de texto
  useEffect(() => {
    if (trackSpeechProgress && text) {
      // Dividir el texto en segmentos lógicos (por frases)
      const segments = text
        .replace(/([.!?])\s+/g, '$1|')
        .replace(/([,;:])\s+/g, '$1|')
        .split('|')
        .filter(s => s.trim().length > 0);
      
      textSegmentsRef.current = segments;
      textProgressRef.current = 0;
    }
  }, [text, trackSpeechProgress]);

  // Efecto para manejar visualizaciones externas
  useEffect(() => {
    if (currentVisualization) {
      // Si es una visualización persistente, guardarla
      if (currentVisualization.isPersistent && !disablePersistentVisualization) {
        setLastPersistentVisualization(currentVisualization);
      }
      
      // Actualizar visualización activa
      setActiveVisualization(currentVisualization);
    } else if (defaultVisualization) {
      // Si no hay visualización actual pero hay una por defecto
      setActiveVisualization(defaultVisualization);
    }
  }, [currentVisualization, defaultVisualization, disablePersistentVisualization]);

  // Limpiar el URL del objeto cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      if (speechCheckIntervalRef.current) {
        clearInterval(speechCheckIntervalRef.current);
      }
    };
  }, [audioUrl]);

  // Efecto para realizar síntesis automática cuando cambia el texto
  useEffect(() => {
    if (text && autoPlay) {
      synthesizeAndPlay();
    }
  }, [text, voiceId, autoPlay]);

  // Manejar eventos de audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const onPlay = () => {
      setIsPlaying(true);
      setIsPaused(false);
      
      // Iniciar seguimiento de texto si está habilitado
      if (trackSpeechProgress) {
        startSpeechProgressTracking();
      }
      
      if (onPlayStart) onPlayStart();
    };
    
    const onPause = () => {
      setIsPlaying(false);
      setIsPaused(true);
      
      // Pausar seguimiento de texto
      if (speechCheckIntervalRef.current) {
        clearInterval(speechCheckIntervalRef.current);
      }
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setAudioProgress(0);
      
      // Finalizar seguimiento de texto
      if (trackSpeechProgress && onTextUpdate) {
        onTextUpdate(text, true); // Notificar texto completo
      }
      
      // Limpiar intervalo
      if (speechCheckIntervalRef.current) {
        clearInterval(speechCheckIntervalRef.current);
      }
      
      if (onPlayEnd) onPlayEnd();
    };
    
    const onTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    const handleAudioError = () => {
      const errorMsg = 'Error al reproducir el audio';
      setError(errorMsg);
      setIsPlaying(false);
      if (onError) onError(errorMsg);
    };
    
    // Añadir event listeners
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('error', handleAudioError);
    
    // Limpiar event listeners
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', handleAudioError);
    };
  }, [onPlayStart, onPlayEnd, onError, text, trackSpeechProgress, onTextUpdate]);

  // Iniciar seguimiento de progreso del habla
  const startSpeechProgressTracking = () => {
    // Resetear progreso
    textProgressRef.current = 0;
    setCurrentSpeechSegment('');
    
    // Crear intervalo para actualizar progreso basado en el progreso del audio
    if (speechCheckIntervalRef.current) {
      clearInterval(speechCheckIntervalRef.current);
    }
    
    speechCheckIntervalRef.current = setInterval(() => {
      if (!audioRef.current || textSegmentsRef.current.length === 0) return;
      
      const audio = audioRef.current;
      const progress = audio.currentTime / audio.duration;
      
      // Calcular cuántos segmentos deberían haberse reproducido
      const segmentCount = textSegmentsRef.current.length;
      const estimatedSegmentIndex = Math.min(
        Math.floor(progress * segmentCount),
        segmentCount - 1
      );
      
      // Si avanzamos a un nuevo segmento, actualizar
      if (estimatedSegmentIndex > textProgressRef.current) {
        textProgressRef.current = estimatedSegmentIndex;
        
        // Construir el texto acumulado hasta el segmento actual
        const spokenText = textSegmentsRef.current
          .slice(0, estimatedSegmentIndex + 1)
          .join(' ');
        
        setCurrentSpeechSegment(spokenText);
        
        // Notificar al componente padre
        if (onTextUpdate) {
          onTextUpdate(spokenText, false);
        }
      }
    }, 250); // Verificar cada 250ms
  };

  // Función para sintetizar el texto y reproducirlo
  const synthesizeAndPlay = async () => {
    if (!text.trim()) {
      const errorMsg = 'No hay texto para sintetizar';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Notificación simple sin usar dismiss
      toast.info('Generando audio...', {
        duration: 0 // Infinito, lo quitaremos manualmente con un success
      });
      
      // Usando el servicio centralizado de ElevenLabs
      const audioBlob = await ElevenLabsService.synthesizeSpeech({
        text,
        voiceId,
        stability,
        similarityBoost,
        style,
        useBreathingMarkers: true,
        useCache: true
      });
      
      // En lugar de dismiss, simplemente mostramos un nuevo toast de éxito
      toast.success('Audio generado');
      
      // Crear URL para el blob de audio
      const url = URL.createObjectURL(audioBlob);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioProgress(0);
      setAudioUrl(url);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error('Error al reproducir audio:', err);
          const errorMsg = 'Error al reproducir audio. Compruebe que su navegador permite la reproducción automática.';
          setError(errorMsg);
          toast.error(errorMsg);
          if (onError) onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error en síntesis de voz:', err);
      let errorMsg = 'Error en la síntesis de voz. Intente de nuevo.';
      
      if (err instanceof Error) {
        if (err.message.includes('API key')) {
          errorMsg = 'Error de autenticación con ElevenLabs. Verifique su API key.';
        } else if (err.message.includes('quota')) {
          errorMsg = 'Ha excedido su cuota de uso de ElevenLabs.';
        } else if (err.message.includes('voice')) {
          errorMsg = `Voz "${voiceId}" no encontrada. Verifique el ID de voz.`;
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para determinar qué visualización mostrar con soporte para tipo 'text'
  const determineVisualizationToShow = () => {
    // Si estamos cargando visualización
    if (isLoadingVisualization) {
      return {
        type: 'loading',
        content: 'Cargando visualización...'
      };
    }
    
    // Si hay una visualización activa explícita, usarla
    if (currentVisualization) {
      // Para visualizaciones de tipo texto, formatear el contenido correctamente
      if (currentVisualization.type === 'text') {
        return {
          type: 'text',
          content: typeof currentVisualization.content === 'string' 
            ? { text: currentVisualization.content } 
            : currentVisualization.content,
          isPersistent: currentVisualization.isPersistent
        };
      }
      return currentVisualization;
    }
    
    // Si no hay visualización activa pero hay una persistente guardada y no está desactivada
    if (lastPersistentVisualization && !disablePersistentVisualization) {
      // También comprobar si la persistente es de tipo texto
      if (lastPersistentVisualization.type === 'text') {
        return {
          type: 'text',
          content: typeof lastPersistentVisualization.content === 'string' 
            ? { text: lastPersistentVisualization.content } 
            : lastPersistentVisualization.content,
          isPersistent: true
        };
      }
      return lastPersistentVisualization;
    }
    
    // Si hay visualización por defecto, usarla
    if (defaultVisualization) {
      // También comprobar si la default es de tipo texto
      if (defaultVisualization.type === 'text') {
        return {
          type: 'text',
          content: typeof defaultVisualization.content === 'string' 
            ? { text: defaultVisualization.content } 
            : defaultVisualization.content,
          isPersistent: defaultVisualization.isPersistent
        };
      }
      return defaultVisualization;
    }
    
    // Sin visualización
    return null;
  };

  // Obtener la visualización actual que debe mostrarse
  const currentActiveVisualization = determineVisualizationToShow();
  
  // Notificar al componente padre sobre cambios en la visualización activa
  useEffect(() => {
    if (onVisualizationChange && currentActiveVisualization !== activeVisualization) {
      setActiveVisualization(currentActiveVisualization);
      onVisualizationChange(currentActiveVisualization);
    }
  }, [currentActiveVisualization, activeVisualization, onVisualizationChange]);
  
  // Función para limpiar visualizaciones persistentes
  const clearPersistentVisualizations = () => {
    setLastPersistentVisualization(null);
    
    // Solo notificar cambios si hay una función de callback
    if (onVisualizationChange) {
      // Determinar nueva visualización activa sin persistencia
      const newActiveVisualization = currentVisualization || defaultVisualization || null;
      onVisualizationChange(newActiveVisualization);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(err => {
        console.error('Error al reproducir audio:', err);
        toast.error('Error al reproducir audio');
      });
    } else {
      synthesizeAndPlay();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  const handleRegenerate = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Eliminar el URL anterior
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    synthesizeAndPlay();
  };

  // Si no queremos mostrar controles, solo renderizamos el elemento de audio
  if (!showControls) {
    return <audio ref={audioRef} hidden />;
  }
  
  // Renderizado de botones basado en variante
  const renderButton = () => {
    const baseClasses = getButtonClasses();
    
    if (isPlaying) {
      return (
        <button
          onClick={handlePause}
          disabled={isLoading || !audioUrl}
          className={`${baseClasses} ${variant !== 'text' ? 'bg-red-500 hover:bg-red-600' : 'text-red-500 hover:bg-red-50'}`}
          aria-label="Pausar audio"
          title="Pausar audio"
        >
          {variant === 'text' && "Pausar"}
          <Pause className={iconSizeClass} />
        </button>
      );
    }
    
    if (isPaused && audioUrl) {
      return (
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className={`${baseClasses} ${variant !== 'text' ? 'bg-green-500 hover:bg-green-600' : 'text-green-500 hover:bg-green-50'}`}
          aria-label="Reanudar audio"
          title="Reanudar audio"
        >
          {variant === 'text' && "Reanudar"}
          <Play className={iconSizeClass} />
        </button>
      );
    }
    
    return (
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className={`${baseClasses} ${variant !== 'text' ? 'bg-blue-500 hover:bg-blue-600' : 'text-blue-500 hover:bg-blue-50'}`}
        aria-label="Reproducir audio"
        title="Reproducir audio"
      >
        {isLoading ? (
          <>
            {variant === 'text' && "Generando..."}
            <Loader2 className={`${iconSizeClass} animate-spin`} />
          </>
        ) : (
          <>
            {variant === 'text' && "Reproducir"}
            {audioUrl ? <Play className={iconSizeClass} /> : <Volume2 className={iconSizeClass} />}
          </>
        )}
      </button>
    );
  };
  
  // Renderizado de indicador de audio
  const renderAudioIndicator = () => {
    if (!isPlaying && !isPaused) return null;
    
    return (
      <div className="relative w-full max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all"
          style={{ width: `${audioProgress}%` }}
        ></div>
      </div>
    );
  };
  
  // Renderizado de indicadores de audio animados
  const renderAudioWaveform = () => {
    if (!isPlaying) return null;
    
    return (
      <div className="flex items-center space-x-1 ml-2">
        <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <div className="w-1 h-5 bg-green-500 rounded-full animate-pulse delay-75"></div>
        <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-150"></div>
        <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse delay-300"></div>
        <div className="w-1 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
      </div>
    );
  };
  
  // Renderizado de indicador de visualización persistente (opcional)
  const renderPersistentIndicator = () => {
    if (!lastPersistentVisualization || disablePersistentVisualization) return null;
    
    // Personalizar el mensaje según el tipo de visualización
    const visualizationType = lastPersistentVisualization.type === 'text' 
      ? 'Texto persistente activo' 
      : 'Visualización persistente activa';
    
    return (
      <div className="mt-1 flex items-center">
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full mr-2">
          {visualizationType}
        </span>
        <button
          onClick={clearPersistentVisualizations}
          className="text-xs text-blue-600 hover:underline"
        >
          Limpiar
        </button>
      </div>
    );
  };

  // Renderizado de visualizaciones de texto en modo de depuración
  const renderTextVisualizationDebug = () => {
    if (!currentActiveVisualization || currentActiveVisualization.type !== 'text') return null;
    
    // Solo mostrar esto en modo desarrollo/depuración
    if (process.env.NODE_ENV !== 'development') return null;
    
    const textContent = typeof currentActiveVisualization.content === 'string' 
      ? currentActiveVisualization.content 
      : currentActiveVisualization.content?.text || '';
    
    return (
      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs max-w-md opacity-75">
        <div className="flex justify-between mb-1">
          <span className="font-medium">Visualización de texto:</span>
          <span className="text-gray-500">{currentActiveVisualization.isPersistent ? '(persistente)' : ''}</span>
        </div>
        <div className="max-h-20 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-gray-600">{textContent.substring(0, 150)}{textContent.length > 150 ? '...' : ''}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <audio ref={audioRef} hidden />
      
      <div className="flex items-center space-x-2">
        {renderButton()}
        
        {variant !== 'minimal' && audioUrl && (
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="Regenerar audio"
            title="Regenerar audio"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        
        {isPlaying && renderAudioWaveform()}
      </div>
      
      {variant !== 'minimal' && renderAudioIndicator()}
      {variant !== 'minimal' && renderPersistentIndicator()}
      
      {showError && error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md max-w-md flex items-start">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      
      {/* Para desarrollo/depuración: mostrar segmento actual del habla */}
      {trackSpeechProgress && currentSpeechSegment && false && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm max-w-md">
          <p className="text-blue-800">{currentSpeechSegment}</p>
        </div>
      )}
      
      {/* Visualización de depuración para visualizaciones de texto */}
      {false && renderTextVisualizationDebug()}
    </div>
  );
};