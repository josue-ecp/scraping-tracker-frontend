import React, { useState } from 'react';
import { Code, Eye, Loader2, Play, Sparkles } from 'lucide-react';

const FIELDS = ['titulo', 'precioOferta', 'imagen', 'descripcion'];

export default function StepHtmlInspector({
  formulario,
  setFormulario,
  htmlExtraido,
  metadatos,
  manejarProbarSelectores,
  probandoSelectores,
  errorPrueba,
}) {
  const [vistaActiva, setVistaActiva] = useState('config');

  const cambiarSelector = (campo, clave, valor) => {
    setFormulario((actual) => ({
      ...actual,
      selectores: {
        ...actual.selectores,
        [campo]: {
          ...actual.selectores[campo],
          [clave]: valor,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Inspector HTML y selectores</h2>
          <p className="mt-1 text-xs text-gray-500">
            Verifica los datos detectados y personaliza las etiquetas y selectores CSS.
          </p>
        </div>
        <div className="flex w-full rounded-xl bg-gray-100 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setVistaActiva('config')}
            className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold sm:flex-none sm:px-3 ${
              vistaActiva === 'config' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Selectores</span>
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('html')}
            className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold sm:flex-none sm:px-3 ${
              vistaActiva === 'html' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>HTML descargado</span>
          </button>
        </div>
      </div>

      {vistaActiva === 'config' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-800">
            Edita el nombre visible, el selector CSS o el atributo que se debe leer. Usa «Probar selectores» para consultar la página y verificar los resultados.
          </div>

          {FIELDS.map((campo) => {
            const definicion = formulario.selectores?.[campo] || {
              etiqueta: campo,
              selector: '',
              atributo: '',
              valor: '',
            };

            return (
              <section key={campo} className="space-y-2 rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Etiqueta
                  <input
                    type="text"
                    value={definicion.etiqueta || ''}
                    onChange={(event) => cambiarSelector(campo, 'etiqueta', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={100}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <label className="block text-xs font-semibold text-gray-600">
                    Selector CSS
                    <input
                      type="text"
                      value={definicion.selector || ''}
                      onChange={(event) => cambiarSelector(campo, 'selector', event.target.value)}
                      placeholder="p. ej. .product-title"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-gray-600">
                    Atributo (opcional)
                    <input
                      type="text"
                      value={definicion.atributo || ''}
                      onChange={(event) => cambiarSelector(campo, 'atributo', event.target.value)}
                      placeholder="src, content..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Valor encontrado</span>
                  <span className="mt-1 block break-words text-sm text-gray-800">
                    {definicion.valor || 'Sin coincidencias; prueba otro selector.'}
                  </span>
                </div>
              </section>
            );
          })}

          {errorPrueba && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorPrueba}</p>
          )}
          <button
            type="button"
            onClick={manejarProbarSelectores}
            disabled={probandoSelectores}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {probandoSelectores ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {probandoSelectores ? 'Probando selectores...' : 'Probar selectores en la página'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">HTML recibido del servidor</span>
            <span className="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-700">
              {metadatos?.bytesHtml ?? new Blob([htmlExtraido || '']).size} bytes
            </span>
          </div>
          <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
            <span>Sitio: {metadatos?.sitio || '—'}</span>
            <span>Título: {metadatos?.tituloDocumento || '—'}</span>
          </div>
          <pre className="h-96 overflow-auto rounded-xl border border-gray-800 bg-gray-900 p-4 font-mono text-xs text-emerald-300 shadow-inner">
            {htmlExtraido || 'No se recibió contenido HTML.'}
          </pre>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye className="h-4 w-4" />
            El contenido se muestra como texto y no se ejecuta en el navegador.
          </div>
        </div>
      )}
    </div>
  );
}
