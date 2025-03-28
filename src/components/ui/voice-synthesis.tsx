'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

interface VoiceSynthesisProps {
  text: string;
  voiceId?: string;
  autoPlay?: boolean;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  showControls?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Componente para síntesis de voz utilizando ElevenLabs
 */
export const VoiceSynthesis: React.FC<VoiceSynthesisProps> = ({
  text,
  voiceId = 'gD1IexrzCvsXPHUuT0s3', // ID por defecto de ElevenLabs
  autoPlay = false,
  stability = 0.5,
  similarityBoost = 0.75,
  style = 0,
  showControls = true,
  onPlayStart,
  onPlayEnd,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  // Función para sintetizar el texto y reproducirlo
  const synthesizeAndPlay = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Usando el servicio centralizado de ElevenLabs
      const audioBlob = await ElevenLabsService.synthesizeSpeech({
        text,
        voiceId,
        stability,
        similarityBoost,
        style
      });
      
      // Crear URL para el blob de audio
      const url = URL.createObjectURL(audioBlob);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onplay = () => {
          setIsPlaying(true);
          if (onPlayStart) onPlayStart();
        };
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          if (onPlayEnd) onPlayEnd();
        };
        
        audioRef.current.onerror = (e) => {
          const errorMsg = 'Error al reproducir el audio';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        };
        
        audioRef.current.play().catch(err => {
          console.error('Error al reproducir audio:', err);
          const errorMsg = 'Error al reproducir audio. Compruebe que su navegador permite la reproducción automática.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        });
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
      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioUrl) {
      setIsPlaying(true);
      if (onPlayStart) onPlayStart();
      audioRef.current.play();
    } else {
      synthesizeAndPlay();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Si no queremos mostrar controles, solo renderizamos el elemento de audio
  if (!showControls) {
    return (
      <audio 
        ref={audioRef} 
        onPlay={() => {
          setIsPlaying(true);
          if (onPlayStart) onPlayStart();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onPlayEnd) onPlayEnd();
        }}
        hidden
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <audio 
        ref={audioRef} 
        onPlay={() => {
          setIsPlaying(true);
          if (onPlayStart) onPlayStart();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onPlayEnd) onPlayEnd();
        }}
        hidden
      />
      
      <div className="flex space-x-2">
        {isPlaying ? (
          <button
            onClick={handlePause}
            disabled={isLoading || !audioUrl}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            aria-label="Pausar audio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            aria-label="Reproducir audio"
          >
            {isLoading ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};