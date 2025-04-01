'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import LLMvsSLMTable from './LLMvsSLMTable';

// Tipos de visualización soportados
export type VisualizationType = 'slide' | 'table' | 'image' | 'chart' | 'none';

// Interfaz para el contenido de visualización
interface VisualizationContent {
  type?: string; // Subtipo específico (ej: "llmvsslm" para tablas)
  title?: string;
  text?: string;
  image?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
  data?: any; // Para visualizaciones de datos
}

// Interfaz para las propiedades del componente
interface VisualizationProps {
  type?: VisualizationType;
  content?: VisualizationContent;
  title?: string;
  alt?: string;
  className?: string;
  showAnimation?: boolean;
}

const VisualizationComponent: React.FC<VisualizationProps> = ({
  type = 'none',
  content = {},
  title,
  alt = 'Visualización',
  className = '',
  showAnimation = true
}) => {
  // Placeholder para cuando no hay visualización
  const EmptyVisualization = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-gray-400 text-sm">
        {content.text || "La visualización aparecerá aquí durante la presentación"}
      </p>
    </div>
  );

  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  // Renderizado según el tipo de visualización
  const renderVisualization = () => {
    switch (type) {
      case 'slide':
        return (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              {content.title && (
                <h2 className="text-2xl font-medium mb-4 text-gray-900">{content.title}</h2>
              )}
              {content.text && (
                <p className="text-gray-700 mb-4">{content.text}</p>
              )}
              {content.image && (
                <div className="mt-4 flex justify-center">
                  <Image
                    src={content.image}
                    alt={alt}
                    width={800}
                    height={450}
                    className="rounded-lg shadow-sm"
                    priority
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      
      case 'table':
        // Para tablas específicas como LLM vs SLM
        if (content.type === 'llmvsslm') {
          return <LLMvsSLMTable title={content.title} showAnimation={showAnimation} />;
        }
        
        // Para tablas genéricas con datos
        return (
          <div className="overflow-hidden rounded-xl shadow-md bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {content.data?.headers?.map((header: string, index: number) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {content.data?.rows?.map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'image':
        return (
          <div className="rounded-xl overflow-hidden shadow-md">
            <Image
              src={content.src || ''}
              alt={content.alt || alt}
              width={content.width || 800}
              height={content.height || 600}
              className="object-cover w-full h-auto"
              priority
              onError={(e) => {
                // Fallback si la imagen no carga
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzZjRmNiIgLz48dGV4dCB4PSI0MDAiIHk9IjMwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjMwIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
              }}
            />
            {content.caption && (
              <div className="p-3 text-sm text-center text-gray-500">
                {content.caption}
              </div>
            )}
          </div>
        );
      
      case 'chart':
        // Para gráficos, usaríamos una biblioteca como Recharts
        // Por ahora mostramos un placeholder
        return (
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-xl font-medium mb-4 text-center text-gray-900">
              {content.title || "Gráfico"}
            </h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">
                {content.caption || "Visualización de datos"}
              </p>
            </div>
          </div>
        );
      
      case 'none':
      default:
        return <EmptyVisualization />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${type}-${content.title}`}
        initial={showAnimation ? "hidden" : "visible"}
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className={`h-full ${className}`}
      >
        {title && (
          <h3 className="text-xl font-medium mb-4 text-center text-gray-900">{title}</h3>
        )}
        {renderVisualization()}
      </motion.div>
    </AnimatePresence>
  );
};

export default VisualizationComponent;