import React from 'react';
import { X } from 'lucide-react';

export default function StepGaleria({ formulario, setFormulario }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Galería de imágenes</h2>
      <p className="text-sm text-gray-500">Imágenes detectadas automáticamente. Puedes agregar más ingresando una URL:</p>
      
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          placeholder="https://ejemplo.com/imagen.jpg"
          value={formulario.nuevaImagen || ''}
          onChange={(e) => setFormulario({ ...formulario, nuevaImagen: e.target.value })}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (formulario.nuevaImagen) {
              setFormulario({
                ...formulario,
                imagenes: [...(formulario.imagenes || []), formulario.nuevaImagen],
                nuevaImagen: ''
              });
            }
          }}
          className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 sm:shrink-0"
        >
          Agregar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {formulario.imagenes && formulario.imagenes.length > 0 ? (
          formulario.imagenes.map((img, index) => (
            <div key={index} className="relative border border-gray-200 rounded-xl h-36 bg-gray-100 overflow-hidden group">
              <img src={img} alt={`Producto ${index}`} className="w-full h-full object-cover" />
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  const nuevasImgs = formulario.imagenes.filter((_, i) => i !== index);
                  setFormulario({ ...formulario, imagenes: nuevasImgs });
                }}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all text-xs cursor-pointer"
                title="Eliminar imagen"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-2 flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-3 text-center text-xs text-gray-400 sm:col-span-3">
            No hay imágenes detectadas. Agrega una manualmente arriba.
          </div>
        )}
      </div>
    </div>
  );
}