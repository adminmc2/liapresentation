'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface VisualizationProps {
  type: 'image' | 'table' | 'react' | undefined;
  content: string | undefined;
  alt?: string;
}

export const Visualization: React.FC<VisualizationProps> = ({ type, content, alt = 'Visualización' }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!type || !content) {
    return null;
  }
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <div 
            className={`relative cursor-pointer transition-all duration-300 ${expanded ? 'w-full max-w-3xl' : 'w-full max-w-md'}`}
            onClick={toggleExpand}
          >
            <Image
              src={content}
              alt={alt}
              width={expanded ? 800 : 400}
              height={expanded ? 600 : 300}
              className="rounded-lg shadow-md object-cover"
              priority
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {expanded ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                )}
              </svg>
            </div>
          </div>
        );
      
      case 'table':
        // Para el caso específico de la tabla LLM vs SLM
        if (content === 'LLMvsSLM') {
          return (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2 text-center">Comparación entre LLM y SLM</h3>
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-gray-300">Característica</th>
                    <th className="p-2 border border-gray-300">SLM (Small Language Model)</th>
                    <th className="p-2 border border-gray-300">LLM (Large Language Model)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-300 font-medium">Tamaño</td>
                    <td className="p-2 border border-gray-300">Más pequeño (millones de parámetros)</td>
                    <td className="p-2 border border-gray-300">Más grande (miles de millones de parámetros)</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-medium">Respuestas</td>
                    <td className="p-2 border border-gray-300">Específicas y concisas</td>
                    <td className="p-2 border border-gray-300">Detalladas y elaboradas</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-medium">Recursos</td>
                    <td className="p-2 border border-gray-300">Requiere menos recursos computacionales</td>
                    <td className="p-2 border border-gray-300">Requiere más recursos computacionales</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-medium">Velocidad</td>
                    <td className="p-2 border border-gray-300">Más rápido</td>
                    <td className="p-2 border border-gray-300">Más lento</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-medium">Ejemplo</td>
                    <td className="p-2 border border-gray-300">"¿Qué puedo hacer con tomates?" → "Salsa de tomate, simple y deliciosa."</td>
                    <td className="p-2 border border-gray-300">"¿Qué puedo hacer con tomates?" → "Podrías preparar gazpacho andaluz, pasta al pomodoro, shakshuka, bruschetta, tomates rellenos..."</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300 font-medium">Aplicaciones</td>
                    <td className="p-2 border border-gray-300">Tareas específicas, dispositivos con recursos limitados</td>
                    <td className="p-2 border border-gray-300">Tareas complejas, generación de contenido detallado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-500 italic">Tabla personalizada: {content}</p>
          </div>
        );
      
      case 'react':
        // Aquí podrías renderizar componentes React dinámicos
        // Por ahora, solo mostramos un placeholder
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-500 italic">Componente React: {content}</p>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="my-4">
      {renderContent()}
    </div>
  );
};