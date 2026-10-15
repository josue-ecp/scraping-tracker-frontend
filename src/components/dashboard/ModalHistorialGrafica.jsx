import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RANGOS = [
  { id: '7', label: '7 días', dias: 7 },
  { id: '30', label: '30 días', dias: 30 },
  { id: 'all', label: 'Todo', dias: null },
];

function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatearFecha(fecha, corta = false) {
  const fechaValida = new Date(fecha);
  if (Number.isNaN(fechaValida.getTime())) return 'Fecha inválida';

  return new Intl.DateTimeFormat('es-MX', corta
    ? { day: '2-digit', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  ).format(fechaValida);
}

function TooltipPrecio({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-500">{formatearFecha(payload[0].payload.fecha)}</p>
      <p className="mt-1 text-sm font-bold text-emerald-700">{formatearPrecio(payload[0].value)}</p>
    </div>
  );
}

export default function ModalHistorialGrafica({ producto, ahora, onCerrar }) {
  const [rangoActivo, setRangoActivo] = useState('30');

  const puntos = useMemo(() => {
    const historial = Array.isArray(producto?.historial_precios)
      ? producto.historial_precios
      : Array.isArray(producto?.historialPrecios)
        ? producto.historialPrecios
        : [];
    const rango = RANGOS.find((opcion) => opcion.id === rangoActivo);
    const fechaLimite = rango?.dias && ahora
      ? ahora - rango.dias * 24 * 60 * 60 * 1000
      : null;

    return historial
      .filter((registro) => registro.precio !== null && registro.precio !== undefined && registro.created_at)
      .map((registro) => ({
        fecha: registro.created_at,
        timestamp: new Date(registro.created_at).getTime(),
        precio: Number(registro.precio),
      }))
      .filter((registro) => Number.isFinite(registro.precio)
        && Number.isFinite(registro.timestamp)
        && (fechaLimite === null || registro.timestamp >= fechaLimite))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [ahora, producto, rangoActivo]);

  const valores = puntos.map((punto) => punto.precio);
  const minimo = valores.length ? Math.min(...valores) : null;
  const maximo = valores.length ? Math.max(...valores) : null;

  if (!producto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="historial-titulo"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Historial de precios</p>
            <h2 id="historial-titulo" className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {producto.titulo}
            </h2>
            <a
              href={producto.enlace}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block max-w-2xl truncate text-xs text-slate-500 hover:text-emerald-700"
            >
              {producto.enlace}
            </a>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar historial"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Precio actual</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">
                {producto.precio_oferta !== null && producto.precio_oferta !== ''
                  ? formatearPrecio(producto.precio_oferta)
                  : 'Sin precio'}
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-1" aria-label="Rango del historial">
              {RANGOS.map((rango) => (
                <button
                  key={rango.id}
                  type="button"
                  onClick={() => setRangoActivo(rango.id)}
                  aria-pressed={rangoActivo === rango.id}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    rangoActivo === rango.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {rango.label}
                </button>
              ))}
            </div>
          </div>

          {puntos.length ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Mínimo del período</p>
                  <p className="mt-1 font-bold text-emerald-700">{formatearPrecio(minimo)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Máximo del período</p>
                  <p className="mt-1 font-bold text-slate-800">{formatearPrecio(maximo)}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-1">
                  <p className="text-xs text-slate-500">Registros</p>
                  <p className="mt-1 font-bold text-slate-800">{puntos.length}</p>
                </div>
              </div>

              <div className="h-64 w-full sm:h-80" aria-label="Gráfica del historial de precios">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={puntos} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(timestamp) => formatearFecha(timestamp, true)}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      domain={[(dataMin) => Math.max(0, Math.floor(dataMin * 0.95)), (dataMax) => Math.ceil(dataMax * 1.05)]}
                      tickFormatter={(precio) => `$${precio}`}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={58}
                    />
                    <Tooltip content={<TooltipPrecio />} />
                    <Line
                      type="monotone"
                      dataKey="precio"
                      name="Precio"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: puntos.length === 1 ? 5 : 3, fill: '#059669', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#047857', stroke: '#d1fae5', strokeWidth: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <p className="font-semibold text-slate-700">Aún no hay registros en este período</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                El historial se actualizará cuando el monitor ejecute el próximo rastreo. Prueba otro rango si el producto tiene registros anteriores.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
