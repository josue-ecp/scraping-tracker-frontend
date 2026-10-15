import React from 'react';
import { Link as LinkIcon, Loader2, X } from 'lucide-react';

export default function StepEnlace({ formulario, manejarCambio, manejarScraping, limpiarEnlace, estaCargando, textoEstado, progresoCarga, error }) {
  return (
    <div className="space-y-6 py-4 text-center sm:py-8">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Configura el rastreo de tu producto</h1>
      <p className="text-gray-500 max-w-lg mx-auto text-sm">
        Pega el link del producto de cualquier tienda. Nuestro sistema analizará la página para configurar la extracción dinámica de datos.
      </p>
      
      <div className="max-w-xl mx-auto mt-6">
        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="relative flex items-center rounded-xl border-2 border-emerald-500 bg-emerald-50/30 px-3 py-3 shadow-inner sm:px-4">
          <LinkIcon className="w-5 h-5 text-emerald-600 mr-3 shrink-0" />
          <input
            type="url"
            name="enlace"
            value={formulario.enlace}
            onChange={manejarCambio}
            placeholder="https://www.tienda.com/producto..."
            disabled={estaCargando}
            aria-label="URL del producto"
            className="w-full min-w-0 bg-transparent pr-8 text-sm text-gray-800 focus:outline-none"
          />
          {formulario.enlace && !estaCargando && (
            <button
              onClick={limpiarEnlace}
              type="button"
              className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-all"
              title="Borrar enlace"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!estaCargando ? (
          <button
            onClick={manejarScraping}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            Analizar e Inspeccionar Página
          </button>
        ) : (
          <div className="mt-8 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 animate-pulse sm:p-6">
            <div className="flex items-center justify-center space-x-2 text-emerald-800 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>{textoEstado}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progresoCarga}%` }}
              ></div>
            </div>
            <span className="text-xs text-emerald-700 font-medium">Progreso: {progresoCarga}%</span>
          </div>
        )}
      </div>
    </div>
  );
}