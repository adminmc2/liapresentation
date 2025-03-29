'use client';

import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Volume2, Settings, Info, Mic, Home } from 'lucide-react';
import Link from 'next/link';

const logoPlaceholder1 = '/logoemc2.svg';
const logoPlaceholder2 = '/logohablandis.svg';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  backgroundColor?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Comunicar con GracIA',
  subtitle = 'Herramientas al servicio del profesorado ELE',
  showHeader = true,
  showFooter = true,
  backgroundColor = 'bg-white'
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${backgroundColor}`}>
      {/* Sistema de notificaciones estilo Apple */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#333'
          }
        }}
      />

      {showHeader && (
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-gray-200 bg-white backdrop-blur-md bg-opacity-90 sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Logo y título */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <Image
                    src={logoPlaceholder1}
                    alt="LIA Logo 1"
                    width={40}
                    height={40}
                    className="rounded-full shadow-sm"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA3QUZGIiByeD0iMjAiIC8+PHRleHQgeD0iMjAiIHk9IjI2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MSUE8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  <Image
                    src={logoPlaceholder2}
                    alt="LIA Logo 2"
                    width={40}
                    height={40}
                    className="rounded-full shadow-sm"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA3QUZGIiByeD0iMjAiIC8+PHRleHQgeD0iMjAiIHk9IjI2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MSUE8L3RleHQ+PC9zdmc+';
                    }}
                  />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
              </div>

              {/* Navegación y controles */}
              <div className="flex items-center space-x-1">
                <Link 
                  href="/" 
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center"
                  title="Inicio"
                >
                  <Home className="h-5 w-5" />
                </Link>
                <Link 
                  href="/test" 
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center"
                  title="Pruebas"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Link 
                  href="/presentation" 
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center"
                  title="Presentación"
                >
                  <Mic className="h-5 w-5" />
                </Link>
                <button
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center"
                  title="Acerca de"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>
      )}

      {/* Contenido principal */}
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          {children}
        </motion.div>
      </main>

      {showFooter && (
        <motion.footer 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-t border-gray-200 bg-gray-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} GracIA - Herramientas para la comunicación de ELE
              </p>
              <p className="text-sm text-gray-500">
                Desarrollado para EMC + Hablandis
              </p>
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  );
};

export default Layout;