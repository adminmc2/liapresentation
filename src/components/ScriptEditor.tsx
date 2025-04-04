'use client';

import React, { useState, useEffect } from 'react';
import { ScriptSegment, liaScript } from '@/lib/data/script-data';
import Layout from '@/components/Layout';

export default function SimpleScriptEditor() {
  // Estado para almacenar el guión actual
  const [script, setScript] = useState<ScriptSegment[]>([]);
  
  // Estado para el segmento que se está editando
  const [editingSegment, setEditingSegment] = useState<ScriptSegment | null>(null);
  
  // Estado para controlar el diálogo de edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para mostrar código en ventana modal
  const [showTsCode, setShowTsCode] = useState(false);
  const [tsCodeContent, setTsCodeContent] = useState('');
  
  // Estado para previsualización de texto formateado
  const [showTextPreview, setShowTextPreview] = useState(false);
  
  // Cargar el guión inicial
  useEffect(() => {
    // Intentar cargar desde localStorage primero
    const savedScript = localStorage.getItem('liaScript');
    if (savedScript) {
      try {
        const parsedScript = JSON.parse(savedScript);
        setScript(parsedScript);
        alert('Guión cargado desde almacenamiento local');
      } catch (e) {
        console.error('Error al cargar el guión desde localStorage:', e);
        // Si hay un error, cargar el guión predeterminado
        setScript(liaScript);
        alert('Error al cargar el guión guardado, usando predeterminado');
      }
    } else {
      // Si no hay nada en localStorage, usar el guión predeterminado
      setScript(liaScript);
    }
  }, []);

  // Guardar el guión en localStorage cuando cambie
  useEffect(() => {
    if (script.length > 0) {
      localStorage.setItem('liaScript', JSON.stringify(script));
    }
  }, [script]);

  // Crear un nuevo segmento
  const handleCreateSegment = () => {
    const lastSegment = script.length > 0 ? script[script.length - 1] : null;
    const newScene = lastSegment ? lastSegment.scene : 1;
    
    const newSegment: ScriptSegment = {
      id: `escena${newScene}-nuevo-${Date.now()}`,
      scene: newScene,
      speaker: 'LIA',
      text: '',
      keywords: [],
      responseVoice: true,
      isActive: false,
      isCompleted: false,
      visualTiming: 'start',    // Valor predeterminado
      visualDelay: 500,         // Valor predeterminado
    };
    
    setEditingSegment(newSegment);
    setIsEditing(false);
  };

  // Editar un segmento existente
  const handleEditSegment = (segment: ScriptSegment, index: number) => {
    setEditingSegment({...segment, keywords: [...segment.keywords]});
    setIsEditing(true);
    setShowTextPreview(false);
  };

  // Duplicar un segmento
  const handleDuplicateSegment = (segment: ScriptSegment, index: number) => {
    const duplicatedSegment: ScriptSegment = {
      ...segment,
      id: `${segment.id}-copy-${Date.now()}`
    };
    
    const newScript = [...script];
    newScript.splice(index + 1, 0, duplicatedSegment);
    setScript(newScript);
    alert('Segmento duplicado');
  };

  // Eliminar un segmento
  const handleDeleteSegment = (index: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este segmento?')) {
      const newScript = [...script];
      newScript.splice(index, 1);
      setScript(newScript);
      alert('Segmento eliminado');
    }
  };

  // Mover un segmento hacia arriba
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newScript = [...script];
      const temp = newScript[index];
      newScript[index] = newScript[index - 1];
      newScript[index - 1] = temp;
      setScript(newScript);
      alert('Segmento movido hacia arriba');
    }
  };

  // Mover un segmento hacia abajo
  const handleMoveDown = (index: number) => {
    if (index < script.length - 1) {
      const newScript = [...script];
      const temp = newScript[index];
      newScript[index] = newScript[index + 1];
      newScript[index + 1] = temp;
      setScript(newScript);
      alert('Segmento movido hacia abajo');
    }
  };

  // Guardar un segmento (nuevo o editado)
  const handleSaveSegment = () => {
    if (!editingSegment) return;
    
    // Validar campos obligatorios
    if (!editingSegment.id || !editingSegment.text) {
      alert('Por favor completa los campos obligatorios (ID y Texto)');
      return;
    }
    
    // Actualizar el guión
    const newScript = [...script];
    
    if (isEditing) {
      // Estamos editando un segmento existente
      const index = script.findIndex(s => s.id === editingSegment.id);
      if (index !== -1) {
        newScript[index] = editingSegment;
        alert('Segmento actualizado');
      }
    } else {
      // Estamos creando un nuevo segmento
      newScript.push(editingSegment);
      alert('Nuevo segmento añadido');
    }
    
    setScript(newScript);
    setEditingSegment(null);
    setIsEditing(false);
    setShowTextPreview(false);
  };

  // Cancelar la edición
  const handleCancelEdit = () => {
    setEditingSegment(null);
    setIsEditing(false);
    setShowTextPreview(false);
  };

  // Exportar el guión completo
  const handleExportScript = () => {
    const scriptJson = JSON.stringify(script, null, 2);
    const blob = new Blob([scriptJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lia-script.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Guión exportado correctamente');
  };
  
  // Generar código TypeScript para script-data.ts
  const generateTsCode = () => {
    // Convertir el guión a código TypeScript formateado correctamente
    const scriptArrayString = JSON.stringify(script, null, 2)
      // Añadir indentación adecuada
      .replace(/"([^"]+)":/g, '$1:')
      // Formatear correctamente los arrays vacíos
      .replace(/\[\]/g, '[]');
    
    // Crear la plantilla de código completa para script-data.ts
    const tsCode = `// src/lib/data/script-data.ts

export interface ScriptSegment {
  id: string;             // Identificador único para el segmento
  scene: number;          // Número de escena
  speaker: 'Armando' | 'LIA'; // Quién habla
  text: string;           // Texto que se dirá/mostrará
  keywords: string[];     // Palabras clave para reconocimiento
  visualType?: 'image' | 'table' | 'react' | 'text'; // Tipo de visualización (añadido 'text')
  visualContent?: string; // URL de imagen, componente o texto a mostrar
  responseVoice?: boolean; // Si el texto debe ser leído por voz
  isActive?: boolean;     // Si es el segmento activo actualmente
  isCompleted?: boolean;  // Si ya se ha completado este segmento
  
  // Campos de control de visualización
  visualTiming?: 'start' | 'middle' | 'end' | 'afterResponse' | 'onPhrase'; // Cuándo mostrar la visualización
  visualTriggerPhrase?: string; // Frase específica que activa la visualización
  visualDelay?: number;   // Tiempo de retraso antes de mostrar la visualización (ms)
  visualDuration?: number; // Duración de la visualización (ms) - opcional, 0 para permanente
  visualPersist?: boolean; // Si la visualización debe mantenerse en las siguientes intervenciones
}

// Guión completo
export const liaScript: ScriptSegment[] = ${scriptArrayString};

// Para compatibilidad con código existente
export const demoScript: ScriptSegment[] = liaScript;`;
    
    return tsCode;
  };
  
  // Copiar código al portapapeles
  const copyTsCodeToClipboard = () => {
    const tsCode = generateTsCode();
    navigator.clipboard.writeText(tsCode)
      .then(() => {
        alert('Código TypeScript copiado al portapapeles. Ahora puedes pegarlo en script-data.ts');
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        alert('Error al copiar. Por favor, usa el botón "Ver código" y cópialo manualmente.');
      });
  };

  // Importar un guión
  const handleImportScript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedScript = JSON.parse(content);
        
        // Validación básica: verificar que es un array
        if (!Array.isArray(importedScript)) {
          throw new Error('El archivo no contiene un guión válido');
        }
        
        // Verificar que al menos tiene las propiedades básicas
        const hasValidStructure = importedScript.every((segment: any) => 
          typeof segment.id === 'string' && 
          typeof segment.scene === 'number' &&
          (segment.speaker === 'LIA' || segment.speaker === 'Armando') &&
          typeof segment.text === 'string' &&
          Array.isArray(segment.keywords)
        );
        
        if (!hasValidStructure) {
          throw new Error('Algunos segmentos no tienen la estructura correcta');
        }
        
        setScript(importedScript);
        alert('Guión importado correctamente');
      } catch (error) {
        console.error('Error al importar el guión:', error);
        alert('Error al importar el guión. Verifica el formato.');
      }
    };
    
    reader.readAsText(file);
    
    // Limpiar el input para permitir cargar el mismo archivo de nuevo
    event.target.value = '';
  };

  // Obtener estadísticas del guión
  const getScriptStats = () => {
    const totalSegments = script.length;
    const liaSegments = script.filter(s => s.speaker === 'LIA').length;
    const armandoSegments = script.filter(s => s.speaker === 'Armando').length;
    const totalScenes = new Set(script.map(s => s.scene)).size;
    const visualSegments = script.filter(s => s.visualType).length;
    const persistentVisuals = script.filter(s => s.visualPersist).length;
    const textVisuals = script.filter(s => s.visualType === 'text').length;
    
    return { 
      totalSegments, 
      liaSegments, 
      armandoSegments, 
      totalScenes, 
      visualSegments, 
      persistentVisuals,
      textVisuals
    };
  };

  // Renderizar previsualización de texto formateado
  const renderTextPreview = () => {
    if (!editingSegment?.visualContent) return null;
    
    return (
      <div className="mt-4 border rounded p-4">
        <h3 className="text-sm font-medium mb-2">Previsualización:</h3>
        <div 
          className="prose prose-sm max-w-none" 
          dangerouslySetInnerHTML={{ __html: editingSegment.visualContent }}
        />
      </div>
    );
  };

  const stats = getScriptStats();

  return (
    <Layout
      title="Editor de Guión Simplificado"
      subtitle="Herramienta para crear y editar el guión de LIA"
      backgroundColor="bg-amber-50"
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Editor de Guión</h1>
          
          <div className="space-x-2">
            <input
              type="file"
              id="import-script"
              className="hidden"
              accept=".json"
              onChange={handleImportScript}
            />
            <label htmlFor="import-script" className="px-4 py-2 bg-gray-200 rounded cursor-pointer">
              Importar
            </label>
            
            <button 
              onClick={handleExportScript}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Exportar JSON
            </button>
            
            <button 
              onClick={() => {
                setTsCodeContent(generateTsCode());
                setShowTsCode(true);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded"
            >
              Ver código
            </button>
            
            <button 
              onClick={copyTsCodeToClipboard}
              className="px-4 py-2 bg-indigo-500 text-white rounded"
            >
              Copiar código
            </button>
            
            <button 
              onClick={handleCreateSegment}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Nuevo Segmento
            </button>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-bold mb-3">Estadísticas del Guión</h2>
          <div className="grid grid-cols-7 gap-4 text-center">
            <div className="p-3 bg-blue-100 rounded">
              <p className="text-2xl font-bold">{stats.totalSegments}</p>
              <p className="text-sm text-gray-500">Total de segmentos</p>
            </div>
            <div className="p-3 bg-green-100 rounded">
              <p className="text-2xl font-bold">{stats.liaSegments}</p>
              <p className="text-sm text-gray-500">Segmentos de LIA</p>
            </div>
            <div className="p-3 bg-purple-100 rounded">
              <p className="text-2xl font-bold">{stats.armandoSegments}</p>
              <p className="text-sm text-gray-500">Segmentos de Armando</p>
            </div>
            <div className="p-3 bg-amber-100 rounded">
              <p className="text-2xl font-bold">{stats.totalScenes}</p>
              <p className="text-sm text-gray-500">Escenas</p>
            </div>
            <div className="p-3 bg-pink-100 rounded">
              <p className="text-2xl font-bold">{stats.visualSegments}</p>
              <p className="text-sm text-gray-500">Con visualización</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded">
              <p className="text-2xl font-bold">{stats.persistentVisuals}</p>
              <p className="text-sm text-gray-500">Persistentes</p>
            </div>
            <div className="p-3 bg-teal-100 rounded">
              <p className="text-2xl font-bold">{stats.textVisuals}</p>
              <p className="text-sm text-gray-500">Texto formateado</p>
            </div>
          </div>
        </div>
        
        {/* Filtro por hablante */}
        <div className="mb-4">
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              <button 
                className="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                onClick={() => {}} // No necesitamos filtrar en esta versión simplificada
              >
                Todos los segmentos
              </button>
            </nav>
          </div>
        </div>
        
        {/* Lista de segmentos */}
        <div className="bg-white rounded shadow mb-6">
          {script.map((segment, index) => (
            <div key={segment.id} className="border-b last:border-b-0 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${segment.speaker === 'LIA' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    {segment.speaker === 'LIA' ? 'L' : 'A'}
                  </span>
                  <span className="ml-2 font-medium">{segment.id}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100">Escena {segment.scene}</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditSegment(segment, index)}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDuplicateSegment(segment, index)}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                  >
                    Duplicar
                  </button>
                  <button 
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`px-2 py-1 ${index === 0 ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-800'} text-xs rounded`}
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => handleMoveDown(index)}
                    disabled={index === script.length - 1}
                    className={`px-2 py-1 ${index === script.length - 1 ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-800'} text-xs rounded`}
                  >
                    ↓
                  </button>
                  <button 
                    onClick={() => handleDeleteSegment(index)}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              <div className="ml-8 mt-2">
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Texto:</span>
                  <p className="mt-1 text-sm">{segment.text}</p>
                </div>
                
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Palabras clave:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {segment.keywords.map((keyword, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-1 bg-gray-200 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                {segment.visualType && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Visualización:</span>
                    <p className="mt-1 text-sm">
                      {segment.visualType === 'text' ? 
                        <span className="text-teal-600 font-medium">Texto Formateado</span> : 
                        `${segment.visualType} - ${segment.visualContent}`
                      }
                      {segment.visualTiming && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-pink-100 text-pink-800 rounded">
                          {segment.visualTiming}
                          {segment.visualTiming === 'onPhrase' && segment.visualTriggerPhrase && (
                            <span className="ml-1">: "{segment.visualTriggerPhrase.substring(0, 20)}..."</span>
                          )}
                        </span>
                      )}
                      {segment.visualPersist && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          Persistente
                        </span>
                      )}
                    </p>
                    {segment.visualType === 'text' && segment.visualContent && (
                      <div className="mt-1 p-2 border border-teal-100 rounded bg-teal-50 max-w-lg max-h-20 overflow-y-auto">
                        <div className="text-xs font-mono text-teal-800 whitespace-pre-wrap">
                          {segment.visualContent.length > 100 ? 
                            segment.visualContent.substring(0, 100) + '...' : 
                            segment.visualContent}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Formulario de edición */}
        {editingSegment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Segmento' : 'Nuevo Segmento'}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID del segmento*</label>
                  <input
                    type="text"
                    value={editingSegment.id}
                    onChange={(e) => setEditingSegment({...editingSegment, id: e.target.value})}
                    placeholder="escena1-lia-identificador"
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de escena*</label>
                  <input
                    type="number"
                    value={editingSegment.scene}
                    onChange={(e) => setEditingSegment({...editingSegment, scene: parseInt(e.target.value) || 1})}
                    min="1"
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hablante*</label>
                  <select
                    value={editingSegment.speaker}
                    onChange={(e) => setEditingSegment({...editingSegment, speaker: e.target.value as 'LIA' | 'Armando'})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="LIA">LIA</option>
                    <option value="Armando">Armando</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palabras clave (separadas por comas)</label>
                  <input
                    type="text"
                    value={editingSegment.keywords.join(', ')}
                    onChange={(e) => {
                      const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
                      setEditingSegment({...editingSegment, keywords});
                    }}
                    placeholder="hola, bienvenida, introducción"
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto*</label>
                  <textarea
                    value={editingSegment.text}
                    onChange={(e) => setEditingSegment({...editingSegment, text: e.target.value})}
                    placeholder="Texto que dirá el hablante..."
                    rows={4}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de visualización</label>
                  <select
                    value={editingSegment.visualType || ''}
                    onChange={(e) => {
                      const visualType = e.target.value ? e.target.value as 'image' | 'table' | 'react' | 'text' : undefined;
                      setEditingSegment({...editingSegment, visualType});
                      if (visualType === 'text') {
                        setShowTextPreview(true);
                      } else {
                        setShowTextPreview(false);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Ninguna</option>
                    <option value="image">Imagen</option>
                    <option value="table">Tabla</option>
                    <option value="react">Componente React</option>
                    <option value="text">Texto Formateado</option>
                  </select>
                </div>
                
                {editingSegment.visualType && (
                  <div className={editingSegment.visualType === 'text' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenido visual</label>
                    {editingSegment.visualType === 'text' ? (
                      <>
                        <textarea
                          value={editingSegment.visualContent || ''}
                          onChange={(e) => setEditingSegment({...editingSegment, visualContent: e.target.value})}
                          placeholder="Introduce el texto formateado (puedes usar HTML básico)"
                          rows={5}
                          className="w-full p-2 border rounded font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Puedes usar HTML básico como &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
                        </p>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => setShowTextPreview(!showTextPreview)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {showTextPreview ? 'Ocultar previsualización' : 'Mostrar previsualización'}
                          </button>
                        </div>
                        {showTextPreview && renderTextPreview()}
                      </>
                    ) : (
                      <input
                        type="text"
                        value={editingSegment.visualContent || ''}
                        onChange={(e) => setEditingSegment({...editingSegment, visualContent: e.target.value})}
                        placeholder={
                          editingSegment.visualType === 'image' 
                            ? "/ruta-a-imagen.jpg" 
                            : editingSegment.visualType === 'react'
                              ? "NombreComponente"
                              : "Identificador de tabla"
                        }
                        className="w-full p-2 border rounded"
                      />
                    )}
                  </div>
                )}
                
                {/* Nuevos campos para control de visualización */}
                {editingSegment.visualType && (
                  <>
                    <div className={editingSegment.visualType === 'text' ? 'md:col-span-1' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Momento de visualización</label>
                      <select
                        value={editingSegment.visualTiming || 'start'}
                        onChange={(e) => setEditingSegment({...editingSegment, visualTiming: e.target.value as 'start' | 'middle' | 'end' | 'afterResponse' | 'onPhrase'})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="start">Al inicio de la intervención</option>
                        <option value="middle">En medio de la intervención</option>
                        <option value="end">Al final de la intervención</option>
                        <option value="afterResponse">Después de respuesta de Armando</option>
                        <option value="onPhrase">Al mencionar una frase específica</option>
                      </select>
                    </div>
                    
                    {editingSegment.visualTiming === 'onPhrase' && (
                      <div className={editingSegment.visualType === 'text' ? 'md:col-span-1' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frase activadora</label>
                        <input
                          type="text"
                          value={editingSegment.visualTriggerPhrase || ''}
                          onChange={(e) => setEditingSegment({...editingSegment, visualTriggerPhrase: e.target.value})}
                          placeholder="Frase que activa la visualización"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    )}
                    
                    <div className={editingSegment.visualType === 'text' ? 'md:col-span-1' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retraso antes de mostrar (ms): {editingSegment.visualDelay || 500}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="100"
                        value={editingSegment.visualDelay || 500}
                        onChange={(e) => setEditingSegment({...editingSegment, visualDelay: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                    
                    <div className={editingSegment.visualType === 'text' ? 'md:col-span-1' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración (ms, 0 = permanente): {editingSegment.visualDuration || 0}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="500"
                        value={editingSegment.visualDuration || 0}
                        onChange={(e) => setEditingSegment({...editingSegment, visualDuration: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(editingSegment.visualDuration || 0) === 0 ? 'Se mostrará permanentemente hasta el siguiente cambio' : `Se mostrará durante ${(editingSegment.visualDuration || 0) / 1000} segundos`}
                      </p>
                    </div>
                    
                    {/* Checkbox para persistencia visual */}
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingSegment.visualPersist || false}
                          onChange={(e) => setEditingSegment({...editingSegment, visualPersist: e.target.checked})}
                          className="rounded text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Mantener esta visualización en las siguientes intervenciones
                        </span>
                      </label>
                      <p className="ml-6 text-xs text-gray-500 mt-1">
                        Si está activado, esta visualización permanecerá visible hasta que otra visualización la reemplace explícitamente
                      </p>
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingSegment.responseVoice || false}
                      onChange={(e) => setEditingSegment({...editingSegment, responseVoice: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Sintetizar voz para este segmento</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveSegment}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de visualización de código */}
        {showTsCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Código para script-data.ts</h2>
                <div className="space-x-2">
                  <button 
                    onClick={copyTsCodeToClipboard}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Copiar al portapapeles
                  </button>
                  <button 
                    onClick={() => setShowTsCode(false)}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              <div className="overflow-auto flex-1 bg-gray-100 p-4 rounded">
                <pre className="text-sm font-mono whitespace-pre-wrap">{tsCodeContent}</pre>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>Copia este código y pégalo en el archivo src/lib/data/script-data.ts para actualizar el guión.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}