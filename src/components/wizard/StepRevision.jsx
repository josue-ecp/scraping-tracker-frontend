import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function StepRevision({ guardarProducto, guardando, error }) {
  return (
    <div className="space-y-6 py-4 text-center sm:py-6">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 sm:h-16 sm:w-16" />
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">¡Todo listo para guardar!</h2>
      <p className="text-gray-500 max-w-md mx-auto text-sm">
        La configuración y los selectores se guardarán en la base de datos. El scheduler de Laravel consultará la página según la frecuencia elegida y registrará los cambios de precio.
      </p>
      {error && <p role="alert" className="mx-auto max-w-md rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button
        onClick={guardarProducto}
        disabled={guardando}
        className="w-full cursor-pointer rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {guardando ? 'Guardando...' : 'Guardar y activar monitoreo'}
      </button>
    </div>
  );
}