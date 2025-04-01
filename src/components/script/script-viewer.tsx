'use client';

import React, { useEffect, useState } from 'react';
import { ScriptSegment } from '@/lib/data/script-data';
import { scriptManager } from '@/lib/services/enhanced-script-manager';

interface ScriptViewerProps {
  onSegmentChange?: (segment: ScriptSegment) => void;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ onSegmentChange }) => {
  const [scriptState, setScriptState] = useState<ScriptState>(scriptManager.getState());
  
  useEffect(() => {
    // Suscribirse a cambios en el guión
    const unsubscribe = scriptManager.subscribe(state => {
      setScriptState(state);
      
      // Notificar al componente padre si hay un cambio de segmento
      const currentSegment = scriptManager.getCurrentSegment();
      if (currentSegment && onSegmentChange) {
        onSegmentChange(currentSegment);
      }
    });
    
    // Limpiar suscripción al desmontar
    return unsubscribe;
  }, [onSegmentChange]);
  
  const currentSegment = scriptManager.getCurrentSegment();
  
  if (!currentSegment) {
    return <div className="p-4 bg-gray-100 rounded-lg">No hay guión disponible</div>;
  }
  
  // Función para avanzar al siguiente segmento (oculta, solo para uso interno)
  const handleProgress = () => {
    scriptManager.nextSegment();
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Escena {currentSegment.scene}: {currentSegment.id}</h3>
        <div className="flex items-center">
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {scriptState.currentIndex + 1}/{scriptState.segments.length}
          </span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-md border border-gray-300">
        <p className="text-lg">{currentSegment.text}</p>
      </div>
      
      {/* Botón discreto para avanzar, visible solo en modo desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-end">
          <button
            onClick={handleProgress}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Avanzar
          </button>
        </div>
      )}
      
      {currentSegment.keywords && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Palabras clave: </span>
          {currentSegment.keywords.join(', ')}
        </div>
      )}
    </div>
  );
};