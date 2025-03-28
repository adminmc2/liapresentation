// src/app/lia/page.tsx

import { LIAPresentation } from '@/components/lia-presentation';

export default function LIAPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">LIA Presentación</h1>
            <span className="text-sm text-gray-500">E=MC² | Una experiencia educativa</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <LIAPresentation />
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} E=MC² • Herramientas educativas para la enseñanza del español
        </div>
      </footer>
    </div>
  );
}