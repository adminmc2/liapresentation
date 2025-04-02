'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Play, Pause, Volume2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { EnhancedElevenLabsService as ElevenLabsService } from '@/lib/services/enhanced-elevenlabs-service';

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
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
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
  onPlayStart,
  onPlayEnd,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  // Limpiar el URL del objeto cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
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
      if (onPlayStart) onPlayStart();
    };
    
    const onPause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setAudioProgress(0);
      if (onPlayEnd) onPlayEnd();
    };
    
    const onTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    // Función renombrada para evitar conflicto
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
  }, [onPlayStart, onPlayEnd, onError]);

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
      
      {showError && error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md max-w-md flex items-start">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};