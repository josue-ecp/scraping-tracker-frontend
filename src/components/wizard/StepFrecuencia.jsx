import React from 'react';

export default function StepFrecuencia({ formulario, manejarCambio }) {
  return (
    <div className="space-y-6">
      <h2 className="border-b pb-4 text-lg font-bold text-gray-900 sm:text-xl">Configuración de Frecuencia de Actualización</h2>
      <p className="text-sm text-gray-500">Elige cada cuánto tiempo el sistema consultará automáticamente el enlace para actualizar el precio y guardarlo en el historial:</p>
      
      <div className="space-y-3">
        {[
          { id: '5', label: 'Cada 5 minutos (Monitoreo intensivo)' },
          { id: '15', label: 'Cada 15 minutos (Monitoreo estándar)' },
          { id: '30', label: 'Cada 30 minutos (Monitoreo extendido)' },
        ].map((opcion) => (
          <label
            key={opcion.id}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
              formulario.frecuenciaScraping === opcion.id
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-medium shadow-sm'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <input
                type="radio"
                name="frecuenciaScraping"
                value={opcion.id}
                checked={formulario.frecuenciaScraping === opcion.id}
                onChange={manejarCambio}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm sm:text-base">{opcion.label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}