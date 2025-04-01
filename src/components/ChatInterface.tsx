'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveform, Mic, Loader2, Volume2, VolumeX, ArrowRight, RotateCcw } from 'lucide-react';
import Image from 'next/image';

// Definición de tipos para los mensajes
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Definición de tipos para los estados
type StatusType = 'idle' | 'listening' | 'processing' | 'speaking' | 'waiting';

// Propiedades del componente
interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void;
  onMicrophoneClick?: () => void;
  onManualAdvance?: () => void;
  onRepeatSegment?: () => void;
  initialMessages?: Message[];
  status?: StatusType;
  showControls?: boolean;
  speakerName?: {
    user: string;
    assistant: string;
  };
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  onMicrophoneClick,
  onManualAdvance,
  onRepeatSegment,
  initialMessages = [],
  status = 'idle',
  showControls = true,
  speakerName = { user: 'Tú', assistant: 'LIA' },
  className = ''
}) => {
  // Estado para mensajes
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Paleta de colores inspirada en Apple/Claude
  const colors = {
    background: '#ffffff',
    userBubble: '#007AFF',
    assistantBubble: '#F2F2F7',
    userText: '#ffffff',
    assistantText: '#000000',
    timestamp: '#8E8E93',
    statusIdle: '#8E8E93',
    statusListening: '#FF9500',
    statusProcessing: '#AF52DE',
    statusSpeaking: '#30D158',
    statusWaiting: '#FF3B30'
  };
  
  // Efecto para hacer scroll al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Función para hacer scroll al final de los mensajes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Función para añadir un mensaje
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };
  
  // Manejar envío de mensaje
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === '') return;
    
    addMessage('user', inputText);
    
    if (onSendMessage) {
      onSendMessage(inputText);
    }
    
    setInputText('');
    
    // Enfocar el input nuevamente
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Manejar el clic en el micrófono
  const handleMicrophoneClick = () => {
    if (onMicrophoneClick) {
      onMicrophoneClick();
    }
  };
  
  // Manejar silenciar/activar audio
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Aquí implementarías la lógica para silenciar/activar el audio
  };
  
  // Formatear la hora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Renderizar indicador de estado
  const renderStatusIndicator = () => {
    let iconColor, statusText;
    
    switch (status) {
      case 'listening':
        iconColor = colors.statusListening;
        statusText = 'Escuchando...';
        return (
          <div className="flex items-center text-sm space-x-1 animate-pulse">
            <Mic className="h-4 w-4" style={{ color: iconColor }} />
            <span>{statusText}</span>
          </div>
        );
      case 'processing':
        iconColor = colors.statusProcessing;
        statusText = 'Procesando...';
        return (
          <div className="flex items-center text-sm space-x-1">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: iconColor }} />
            <span>{statusText}</span>
          </div>
        );
      case 'speaking':
        iconColor = colors.statusSpeaking;
        statusText = 'Hablando...';
        return (
          <div className="flex items-center text-sm space-x-1">
            <AudioWaveform className="h-4 w-4" style={{ color: iconColor }} />
            <span>{statusText}</span>
          </div>
        );
      case 'waiting':
        iconColor = colors.statusWaiting;
        statusText = 'Esperando respuesta...';
        return (
          <div className="flex items-center text-sm space-x-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="ml-2">{statusText}</span>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Variantes para animaciones
  const messageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Cabecera del chat */}
      <header className="p-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Conversación</h2>
        
        {status !== 'idle' && (
          <div className="flex items-center space-x-2">
            {renderStatusIndicator()}
            
            {status === 'speaking' && (
              <button
                onClick={handleToggleMute}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                title={isMuted ? "Activar audio" : "Silenciar"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-gray-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={messageVariants}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[75%]">
                {/* Identificador del hablante (solo asistente) */}
                {message.role === 'assistant' && (
                  <div className="ml-2 mb-1 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-1">
                      <span className="text-xs font-medium text-blue-600">L</span>
                    </div>
                    <span className="text-xs text-gray-500">{speakerName.assistant}</span>
                  </div>
                )}
                
                {/* Contenido del mensaje */}
                <div
                  className={`px-4 py-2.5 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-black'
                  }`}
                  style={{
                    backgroundColor:
                      message.role === 'user'
                        ? colors.userBubble
                        : colors.assistantBubble,
                    color:
                      message.role === 'user'
                        ? colors.userText
                        : colors.assistantText,
                    borderRadius: message.role === 'user' 
                      ? '18px 18px 4px 18px' 
                      : '18px 18px 18px 4px',
                  }}
                >
                  {message.content}
                </div>
                
                {/* Hora del mensaje */}
                <div
                  className="text-xs mt-1 px-2 text-right"
                  style={{ color: colors.timestamp }}
                >
                  {formatTime(message.timestamp)}
                  {message.role === 'user' && (
                    <span className="ml-1">{speakerName.user}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      {/* Área de entrada (opcional) */}
      {showControls && (
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            {/* Botón del micrófono */}
            <button
              onClick={handleMicrophoneClick}
              disabled={status === 'processing'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                status === 'listening'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Activar micrófono"
            >
              <Mic className="h-5 w-5" />
            </button>
            
            {/* Entrada de texto (opcional) */}
            <form onSubmit={handleSendMessage} className="flex-1 mx-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe un mensaje..."
              />
            </form>
            
            {/* Botón de enviar */}
            <button
              onClick={handleSendMessage}
              disabled={inputText.trim() === ''}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                inputText.trim() === ''
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="Enviar mensaje"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* Controles de respaldo (discretos) */}
          <div className="flex justify-center mt-4 space-x-2 opacity-40 hover:opacity-100 transition-opacity">
            <button
              onClick={onManualAdvance}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Avanzar manualmente"
            >
              <ArrowRight className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onRepeatSegment}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Repetir segmento"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;