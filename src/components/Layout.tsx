'use client';

import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
  headerSize?: 'sm' | 'md' | 'lg'; // Nuevo parámetro para tamaño del encabezado
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Comunicar con GracIA-LIA',
  subtitle = 'Herramientas al servicio del profesorado ELE',
  showHeader = true,
  showFooter = true,
  backgroundColor = 'bg-gradient-radial from-white via-[rgba(245,245,255,0.8)] to-[rgba(240,240,250,0.6)]',
  headerSize = 'md' // Tamaño predeterminado
}) => {
  // Configuración de tamaños basado en la prop headerSize
  const headerConfig = {
    sm: {
      padding: 'py-2',
      logoSize: 45,
      titleSize: 'text-lg',
      subtitleSize: 'text-sm'
    },
    md: {
      padding: 'py-4',
      logoSize: 60,
      titleSize: 'text-xl',
      subtitleSize: 'text-base'
    },
    lg: {
      padding: 'py-6',
      logoSize: 75,
      titleSize: 'text-2xl',
      subtitleSize: 'text-lg'
    }
  };

  const { padding, logoSize, titleSize, subtitleSize } = headerConfig[headerSize];

  return (
    <div className={`min-h-screen flex flex-col ${backgroundColor}`}>
      {/* Sistema de notificaciones estilo Apple */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
          className={`z-50 border-b border-pink-100/20 ${padding}`}
          style={{
            background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.9) 0%, rgba(242, 240, 253, 0.85) 50%, rgba(236, 240, 253, 0.8) 100%)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div className="w-full mx-auto px-8 py-2">
            <div className="flex justify-center items-center">
              {/* Logo y título centrados */}
              <div className="flex items-center flex-col md:flex-row">
                <div className="flex-shrink-0 flex items-center space-x-5 mb-2 md:mb-0">
                  <Image
                    src={logoPlaceholder1}
                    alt="EMC2 Logo"
                    width={logoSize}
                    height={logoSize}
                    className="rounded-full shadow-lg border-2 border-white/60"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iJHtsb2dvU2l6ZX0iIGhlaWdodD0iJHtsb2dvU2l6ZX0iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IiR7bG9nb1NpemV9IiBoZWlnaHQ9IiR7bG9nb1NpemV9IiBmaWxsPSIjMDA3QUZGIiByeD0iJHtsb2dvU2l6ZSAvIDJ9IiAvPjx0ZXh0IHg9IiR7bG9nb1NpemUgLyAyfSIgeT0iJHsobG9nb1NpemUgLyAyKSArIDZ9IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iJHtsb2dvU2l6ZSAvIDR9IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RU1DPC90ZXh0Pjwvc3ZnPg==`;
                    }}
                  />
                  <Image
                    src={logoPlaceholder2}
                    alt="Hablandis Logo"
                    width={logoSize}
                    height={logoSize}
                    className="rounded-full shadow-lg border-2 border-white/60"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iJHtsb2dvU2l6ZX0iIGhlaWdodD0iJHtsb2dvU2l6ZX0iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IiR7bG9nb1NpemV9IiBoZWlnaHQ9IiR7bG9nb1NpemV9IiBmaWxsPSIjMzRDNzU5IiByeD0iJHtsb2dvU2l6ZSAvIDJ9IiAvPjx0ZXh0IHg9IiR7bG9nb1NpemUgLyAyfSIgeT0iJHsobG9nb1NpemUgLyAyKSArIDZ9IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iJHtsb2dvU2l6ZSAvIDZ9IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SGFibGFuZGlzPC90ZXh0Pjwvc3ZnPg==`;
                    }}
                  />
                </div>
                <div className="ml-0 md:ml-4 text-center md:text-left">
                  <h1 className={`font-bold text-gray-800 ${titleSize}`}>Construyendo con GraCIA-LIA</h1>
                  <p className={`text-gray-600 ${subtitleSize}`}>Herramientas para el profesorado ELE</p>
                </div>
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
          className="w-full h-full px-2 py-2"
        >
          {children}
        </motion.div>
      </main>

      {showFooter && (
        <motion.footer 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-t border-pink-100/20"
          style={{
            background: 'linear-gradient(to top, rgba(253, 242, 248, 0.3) 0%, rgba(242, 240, 253, 0.2) 50%, rgba(236, 240, 253, 0.15) 100%)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} GracIA - Herramientas para la enseñanza aprendizaje en ELE
              </p>
              <p className="text-sm text-gray-600">
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