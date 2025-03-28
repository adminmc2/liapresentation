'use client';

import React, { useState } from 'react';
import { VoiceSynthesis } from '@/components/ui/voice-synthesis';

export default function TestVoicePage() {
  const [text, setText] = useState('Hola, esto es una prueba de síntesis de voz con ElevenLabs.');
  // Mantenemos el ID de la voz fijo
  const voiceId = 'gD1IexrzCvsXPHUuT0s3'; 
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handlePlayStart = () => {
    setMessage({ text: 'Reproduciendo audio...', type: 'info' });
  };

  const handlePlayEnd = () => {
    setMessage({ text: 'Reproducción completada.', type: 'success' });
  };

  const handleError = (error: string) => {
    setMessage({ text: error, type: 'error' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Prueba de Síntesis de Voz</h1>
      
      <div className="bg-card rounded-lg p-6 shadow-md">
        <div className="mb-4">
          <label htmlFor="textInput" className="block text-sm font-medium mb-1">
            Texto a Sintetizar
          </label>
          <textarea
            id="textInput"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 border rounded-md min-h-[100px]"
            placeholder="Introduce el texto que deseas convertir a voz..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="stability" className="block text-sm font-medium mb-1">
              Estabilidad: {stability}
            </label>
            <input
              id="stability"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mayor estabilidad = voz más consistente, menos variación
            </p>
          </div>

          <div>
            <label htmlFor="similarityBoost" className="block text-sm font-medium mb-1">
              Similitud: {similarityBoost}
            </label>
            <input
              id="similarityBoost"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarityBoost}
              onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mayor similitud = más parecido a la voz original
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="style" className="block text-sm font-medium mb-1">
            Estilo: {style}
          </label>
          <input
            id="style"
            type="range"
            min="0"
            max="100"
            step="1"
            value={style}
            onChange={(e) => setStyle(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ajusta el estilo de expresión de la voz
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <VoiceSynthesis
            text={text}
            voiceId={voiceId}
            stability={stability}
            similarityBoost={similarityBoost}
            style={style}
            showControls={true}
            onPlayStart={handlePlayStart}
            onPlayEnd={handlePlayEnd}
            onError={handleError}
          />
        </div>

        {message && (
          <div 
            className={`mt-4 p-3 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 
              message.type === 'error' ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="mt-8 bg-card rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Documentación</h2>
        <p className="mb-2">
          Esta página permite probar la síntesis de voz utilizando la API de ElevenLabs.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Escribe o modifica el texto que deseas convertir a voz</li>
          <li>Ajusta los parámetros de estabilidad, similitud y estilo según tus preferencias</li>
          <li>Utiliza los controles de reproducción para escuchar el resultado</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Esta página de prueba utiliza los componentes y servicios implementados en el proyecto LIA
          para verificar la correcta integración con la API de ElevenLabs.
        </p>
      </div>
    </div>
  );
}