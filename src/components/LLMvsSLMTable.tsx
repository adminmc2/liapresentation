'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TableRow {
  feature: string;
  llm: string;
  slm: string;
}

interface LLMvsSLMTableProps {
  title?: string;
  showAnimation?: boolean;
}

const LLMvsSLMTable: React.FC<LLMvsSLMTableProps> = ({ 
  title = "Comparación entre LLM y SLM",
  showAnimation = true
}) => {
  // Datos de la tabla
  const tableData: TableRow[] = [
    {
      feature: 'Tamaño del modelo',
      llm: 'Gigantes (>100B parámetros)',
      slm: 'Compactos (<10B parámetros)'
    },
    {
      feature: 'Recursos computacionales',
      llm: 'Alta demanda (GPU múltiples)',
      slm: 'Eficientes (CPU o móvil)'
    },
    {
      feature: 'Implementación',
      llm: 'Principalmente en la nube',
      slm: 'En dispositivo o edge computing'
    },
    {
      feature: 'Privacidad de datos',
      llm: 'Datos enviados a servidores externos',
      slm: 'Procesamiento local posible'
    },
    {
      feature: 'Latencia',
      llm: 'Variable (depende de conexión)',
      slm: 'Baja y predecible'
    },
    {
      feature: 'Casos de uso ideales',
      llm: 'Tareas complejas y creativas',
      slm: 'Tareas específicas bien definidas'
    },
    {
      feature: 'Ejemplos',
      llm: 'GPT-4, Claude, Gemini',
      slm: 'Phi-3, Mistral, Falcon'
    }
  ];

  // Variantes para animación de filas
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-xl shadow-lg bg-white border border-gray-100">
      {title && (
        <h3 className="px-6 py-4 text-lg font-medium text-center border-b">
          {title}
        </h3>
      )}
      
      <div className="overflow-x-auto">
        <motion.table 
          className="w-full"
          initial={showAnimation ? "hidden" : "visible"}
          animate="visible"
          variants={containerVariants}
        >
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Característica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">
                LLM (Large Language Model)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-500 uppercase tracking-wider">
                SLM (Small Language Model)
              </th>
            </tr>
          </thead>
          <motion.tbody 
            className="bg-white divide-y divide-gray-200"
          >
            {tableData.map((row, index) => (
              <motion.tr
                key={index}
                variants={rowVariants}
                custom={index}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.feature}
                </td>
                <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap text-sm text-gray-700">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
                    {row.llm}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-normal md:whitespace-nowrap text-sm text-gray-700">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                    {row.slm}
                  </span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </motion.table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t">
        <p className="text-xs text-gray-500 text-center">
          Los SLM son ideales para aplicaciones educativas por su eficiencia y privacidad.
        </p>
      </div>
    </div>
  );
};

export default LLMvsSLMTable;