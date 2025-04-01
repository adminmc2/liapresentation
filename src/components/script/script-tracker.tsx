'use client';

import React, { useEffect, useState } from 'react';
import { scriptManager } from '@/lib/services/enhanced-script-manager';
import { ScriptSegment } from '@/lib/data/script-data';

export const ScriptTracker: React.FC = () => {
  const [scriptState, setScriptState] = useState<ScriptState>(scriptManager.getState());
  
  useEffect(() => {
    // Suscribirse a cambios en el guión
    const unsubscribe = scriptManager.subscribe(state => {
      setScriptState(state);
    });
    
    // Limpiar suscripción al desmontar
    return unsubscribe;
  }, []);
  
  const handleSegmentClick = (index: number) => {
    // Esta función solo se usará en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      scriptManager.goToIndex(index);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Progreso del Guión</h3>
      
      <div className="flex mb-2">
        {scriptState.segments.map((_, index) => (
          <div
            key={index}
            className={`h-2 flex-1 mx-0.5 rounded-full cursor-pointer ${
              index === scriptState.currentIndex
                ? 'bg-blue-600'
                : index < scriptState.currentIndex
                ? 'bg-blue-300'
                : 'bg-gray-200'
            }`}
            onClick={() => handleSegmentClick(index)}
            title={`Segmento ${index + 1}`}
          />
        ))}
      </div>
      
      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
        {scriptState.segments.map((segment, index) => (
          <div
            key={index}
            className={`p-2 rounded cursor-pointer transition-colors ${
              index === scriptState.currentIndex
                ? 'bg-blue-100 border-l-4 border-blue-600'
                : index < scriptState.currentIndex
                ? 'bg-gray-50 border-l-4 border-blue-300'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSegmentClick(index)}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium ${segment.speaker === 'LIA' ? 'text-blue-600' : 'text-gray-800'}`}>
                {segment.speaker}: 
              </span>
              <span className="text-xs text-gray-500">Escena {segment.scene}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};