import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Clock3, ExternalLink, History, PackageSearch, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../lib/api';

const ModalHistorialGrafica = lazy(() => import('./ModalHistorialGrafica'));

const INTERVALO_ACTUALIZACION = 60_000;

function formatearPrecio(valor) {
  if (valor === null || valor === undefined || valor === '') return 'Sin precio';

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 'Sin precio';

  return `$${numero.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatearFecha(valor) {
  if (!valor) return 'Sin registros';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registros';

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

function getHistorial(producto) {
  const historial = Array.isArray(producto.historial_precios)
    ? producto.historial_precios
    : Array.isArray(producto.historialPrecios)
      ? producto.historialPrecios
      : [];

  return [...historial].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function BadgeEstado({ producto }) {
  const activo = producto.monitoreo_activo === true || producto.monitoreo_activo === 1;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {activo ? 'Activo' : 'Pausado'}
    </span>
  );
}

function TarjetaResumen({ etiqueta, valor, detalle, icono: Icon, acento = 'emerald' }) {
  const acentos = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{etiqueta}</p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900">{valor}</p>
          <p className="mt-1 text-xs text-slate-500">{detalle}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${acentos[acento]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function EstadoVacio({ onCrear }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <PackageSearch className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-slate-900">Aún no tienes productos monitoreados</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Añade la URL de un producto para configurar sus selectores y empezar a registrar su historial de precios.
      </p>
      <button
        type="button"
        onClick={onCrear}
        className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        Configurar primer rastreo
      </button>
    </div>
  );
}

function CargandoFilas() {
  return (
    <div className="space-y-3 p-5" aria-label="Cargando productos" role="status">
      {[1, 2, 3].map((fila) => (
        <div key={fila} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export default function DashboardProductos({ onCrear }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [horaSeleccion, setHoraSeleccion] = useState(0);
  const [actualizandoFrecuencia, setActualizandoFrecuencia] = useState({});
  const [notificacion, setNotificacion] = useState(null);
  const controladorActivo = useRef(null);
  const temporizadorNotificacion = useRef(null);

  const cargarProductos = useCallback(async (silencioso = false) => {
    controladorActivo.current?.abort();
    const controlador = new AbortController();
    controladorActivo.current = controlador;
    if (silencioso) setActualizando(true);
    else setCargando(true);
    setError('');

    try {
      const resultado = await apiRequest('/productos', {
        signal: controlador.signal,
      });

      if (!Array.isArray(resultado.datos)) {
        throw new Error('La respuesta de Laravel no contiene una lista de productos válida.');
      }

      setProductos(resultado.datos);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'No fue posible conectar con el servidor.');
      }
    } finally {
      if (!controlador.signal.aborted) {
        controladorActivo.current = null;
        setCargando(false);
        setActualizando(false);
      }
    }
  }, []);

  const cambiarFrecuencia = async (producto, frecuenciaNueva) => {
    const frecuenciaAnterior = producto.frecuencia_scraping;
    setActualizandoFrecuencia((actual) => ({ ...actual, [producto.id]: true }));
    setNotificacion(null);

    setProductos((actuales) => actuales.map((item) => (
      item.id === producto.id ? { ...item, frecuencia_scraping: frecuenciaNueva } : item
    )));

    try {
      const resultado = await apiRequest(`/productos/${producto.id}/frecuencia`, {
        method: 'PATCH',
        body: JSON.stringify({ frecuencia: frecuenciaNueva }),
      });

      setProductos((actuales) => actuales.map((item) => (
        item.id === producto.id ? { ...item, ...resultado.datos } : item
      )));
      setNotificacion({
        tipo: 'success',
        mensaje: `Frecuencia actualizada: cada ${frecuenciaNueva} minutos.`,
      });
    } catch (requestError) {
      setProductos((actuales) => actuales.map((item) => (
        item.id === producto.id ? { ...item, frecuencia_scraping: frecuenciaAnterior } : item
      )));
      setNotificacion({
        tipo: 'error',
        mensaje: requestError.message || 'No se pudo actualizar la frecuencia.',
      });
    } finally {
      setActualizandoFrecuencia((actual) => {
        const siguiente = { ...actual };
        delete siguiente[producto.id];
        return siguiente;
      });

      window.clearTimeout(temporizadorNotificacion.current);
      temporizadorNotificacion.current = window.setTimeout(() => setNotificacion(null), 4000);
    }
  };

  useEffect(() => {
    let vigente = true;
    const inicializar = async () => {
      if (vigente) await cargarProductos();
    };
    inicializar();

    const temporizador = window.setInterval(() => {
      if (vigente) cargarProductos(true);
    }, INTERVALO_ACTUALIZACION);

    return () => {
      vigente = false;
      window.clearInterval(temporizador);
      controladorActivo.current?.abort();
      window.clearTimeout(temporizadorNotificacion.current);
    };
  }, [cargarProductos]);

  const resumen = useMemo(() => {
    const activos = productos.filter((producto) => producto.monitoreo_activo === true || producto.monitoreo_activo === 1).length;
    const registros = productos.reduce((total, producto) => total + getHistorial(producto).length, 0);
    const ultimaActualizacion = productos
      .flatMap((producto) => getHistorial(producto))
      .map((registro) => registro.created_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    return { activos, registros, ultimaActualizacion };
  }, [productos]);

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Centro de monitoreo</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Dashboard de productos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Consulta los precios, frecuencias e historial de los productos que estás siguiendo.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <span className="mr-1 hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Actualización automática cada minuto
          </span>
          <button
            type="button"
            onClick={() => cargarProductos(true)}
            disabled={actualizando || cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={onCrear}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Activity className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">No se pudo actualizar el dashboard</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => cargarProductos()}
            className="self-start rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 sm:self-center"
          >
            Reintentar
          </button>
        </div>
      )}

      {notificacion && (
        <div
          role={notificacion.tipo === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mb-5 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-medium ${
            notificacion.tipo === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{notificacion.mensaje}</span>
          <button
            type="button"
            onClick={() => {
              window.clearTimeout(temporizadorNotificacion.current);
              setNotificacion(null);
            }}
            aria-label="Cerrar notificación"
            className="shrink-0 rounded-md px-2 py-1 opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      <section aria-label="Resumen de monitoreo" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaResumen
          etiqueta="Productos activos"
          valor={`${resumen.activos} / ${productos.length}`}
          detalle="Rastreos configurados"
          icono={Activity}
          acento="emerald"
        />
        <TarjetaResumen
          etiqueta="Puntos de historial"
          valor={resumen.registros.toLocaleString('es-MX')}
          detalle="Precios almacenados"
          icono={History}
          acento="blue"
        />
        <TarjetaResumen
          etiqueta="Último registro"
          valor={resumen.ultimaActualizacion ? formatearFecha(resumen.ultimaActualizacion) : '—'}
          detalle="Fecha del último precio guardado"
          icono={Clock3}
          acento="violet"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Productos monitoreados</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {productos.length} productos en tu lista
              <span className="ml-1 sm:hidden">· Desliza para ver más</span>
            </p>
          </div>
          {actualizando && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500" role="status">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Sincronizando
            </span>
          )}
        </div>

        {cargando ? (
          <CargandoFilas />
        ) : productos.length === 0 ? (
          <div className="p-4 sm:p-6"><EstadoVacio onCrear={onCrear} /></div>
        ) : (
          <div className="max-w-full overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch]" role="region" aria-label="Tabla de productos monitoreados" tabIndex="0">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-3.5 sm:px-6">Producto</th>
                  <th scope="col" className="px-4 py-3.5">Precio actual</th>
                  <th scope="col" className="px-4 py-3.5">Frecuencia</th>
                  <th scope="col" className="px-4 py-3.5">Estado</th>
                  <th scope="col" className="px-4 py-3.5">Último registro</th>
                  <th scope="col" className="px-5 py-3.5 text-right sm:px-6">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((producto) => {
                  const historial = getHistorial(producto);
                  const ultimoRegistro = historial.at(-1);
                  const precioAnterior = historial.length > 1 ? Number(historial.at(-2).precio) : null;
                  const precioActual = Number(producto.precio_oferta);
                  const bajada = Number.isFinite(precioAnterior) && Number.isFinite(precioActual)
                    && precioActual < precioAnterior;
                  const subida = Number.isFinite(precioAnterior) && Number.isFinite(precioActual)
                    && precioActual > precioAnterior;
                  const imagen = producto.imagenes?.[0];

                  return (
                    <tr key={producto.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="max-w-[310px] px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {imagen ? (
                            <img src={imagen} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-contain p-1" />
                          ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <PackageSearch className="h-5 w-5" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900" title={producto.titulo}>{producto.titulo}</p>
                            <a
                              href={producto.enlace}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-slate-500 hover:text-emerald-700"
                              title={producto.enlace}
                            >
                              <span className="truncate">{producto.enlace}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">{formatearPrecio(producto.precio_oferta)}</span>
                          {bajada && <ArrowDownRight className="h-4 w-4 text-emerald-600" aria-label="Precio bajó" />}
                          {subida && <ArrowUpRight className="h-4 w-4 text-rose-500" aria-label="Precio subió" />}
                        </div>
                        {producto.precio_regular && Number(producto.precio_regular) > precioActual && (
                          <p className="mt-0.5 text-xs text-slate-400 line-through">{formatearPrecio(producto.precio_regular)}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <label className="sr-only" htmlFor={`frecuencia-${producto.id}`}>
                          Frecuencia de monitoreo de {producto.titulo}
                        </label>
                        <select
                          id={`frecuencia-${producto.id}`}
                          value={producto.frecuencia_scraping}
                          disabled={Boolean(actualizandoFrecuencia[producto.id])}
                          onChange={(event) => cambiarFrecuencia(producto, event.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-wait disabled:opacity-60"
                        >
                          <option value="5">Cada 5 min</option>
                          <option value="15">Cada 15 min</option>
                          <option value="30">Cada 30 min</option>
                        </select>
                        {actualizandoFrecuencia[producto.id] && (
                          <span className="ml-2 text-xs text-slate-400" role="status">Guardando</span>
                        )}
                      </td>
                      <td className="px-4 py-4"><BadgeEstado producto={producto} /></td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatearFecha(ultimoRegistro?.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => {
                            setHoraSeleccion(Date.now());
                            setProductoSeleccionado(producto);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-200 hover:bg-emerald-100"
                          aria-label={`Ver historial de precios de ${producto.titulo}`}
                        >
                          <History className="h-3.5 w-3.5" />
                          Gráfica
                          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px]">{historial.length}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-3 text-right text-xs text-slate-400">
        Los precios se muestran en la moneda de origen de la tienda cuando está disponible; el símbolo $ es ilustrativo.
      </p>

      {productoSeleccionado && (
        <Suspense fallback={(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="status">
            <div className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-xl">Cargando gráfica...</div>
          </div>
        )}>
          <ModalHistorialGrafica
            producto={productoSeleccionado}
            ahora={horaSeleccion}
            onCerrar={() => setProductoSeleccionado(null)}
          />
        </Suspense>
      )}
    </main>
  );
}
