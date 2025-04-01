'use client';

import React, { useState, useEffect, useRef } from 'react';
import { assemblyAIService } from '@/lib/services/assemblyai-service';
import { scriptManager } from '@/lib/services/enhanced-script-manager';

interface VoiceRecognitionProps {
  onResult?: (text: string) => void;
  onSegmentMatch?: (segmentId: string, confidence: number) => void;
}

export const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({ 
  onResult, 
  onSegmentMatch 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Inicializar el grabador de audio
  useEffect(() => {
    const setupMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          await processAudio(blob);
        };
        
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error('Error al acceder al micrófono:', err);
      }
    };
    
    setupMediaRecorder();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Procesar el audio cuando se detiene la grabación
  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    
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
        }
      } else {
        console.error('Error al transcribir:', result.error);
        setTranscript('No se pudo reconocer el audio. Intente de nuevo.');
      }
    } catch (error) {
      console.error('Error al procesar el audio:', error);
      setTranscript('Error al procesar el audio. Intente de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar/detener la grabación
  const toggleListening = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={toggleListening}
        disabled={!mediaRecorderRef.current || isProcessing}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : isProcessing
            ? 'bg-yellow-500'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {isListening ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : isProcessing ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {transcript && (
        <div className="mt-2 p-2 bg-gray-100 rounded-md w-full max-w-md">
          <p className="text-sm text-gray-800">{transcript}</p>
        </div>
      )}
    </div>
  );
};