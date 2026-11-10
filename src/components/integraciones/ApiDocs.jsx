import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clipboard, Code2, KeyRound, RefreshCw, Terminal } from 'lucide-react';
import { API_BASE, apiRequest } from '../../lib/api';

function formatearJson(valor) {
  return JSON.stringify(valor, null, 2);
}

export default function ApiDocs() {
  const [apiKey, setApiKey] = useState('');
  const [json, setJson] = useState('');
  const [cargandoClave, setCargandoClave] = useState(true);
  const [regenerando, setRegenerando] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState('');
  const controlador = useRef(null);

  const cargarProductos = useCallback(async (clave) => {
    controlador.current?.abort();
    const nuevoControlador = new AbortController();
    controlador.current = nuevoControlador;
    setCargandoProductos(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/v1/mis-productos`, {
        headers: {
          Accept: 'application/json',
          'X-API-Key': clave,
        },
        signal: nuevoControlador.signal,
      });
      const resultado = await response.json();
      if (!response.ok) {
        throw new Error(resultado.mensaje || 'No se pudo consultar la API.');
      }
      setJson(formatearJson(resultado));
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'No se pudo consultar la API.');
        setJson('');
      }
    } finally {
      if (!nuevoControlador.signal.aborted) {
        setCargandoProductos(false);
      }
    }
  }, []);

  const cargarClave = useCallback(async () => {
    setCargandoClave(true);
    setError('');
    try {
      const resultado = await apiRequest('/api-key');
      setApiKey(resultado.api_key);
      await cargarProductos(resultado.api_key);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar tu API Key.');
    } finally {
      setCargandoClave(false);
    }
  }, [cargarProductos]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => cargarClave(), 0);
    return () => {
      window.clearTimeout(temporizador);
      controlador.current?.abort();
    };
  }, [cargarClave]);

  const regenerarClave = async () => {
    setRegenerando(true);
    setError('');
    try {
      const resultado = await apiRequest('/api-key/regenerate', { method: 'POST' });
      setApiKey(resultado.api_key);
      await cargarProductos(resultado.api_key);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo regenerar la clave.');
    } finally {
      setRegenerando(false);
    }
  };

  const copiarClave = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError('No se pudo copiar la clave. Selecciónala manualmente.');
    }
  };

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-700">Integraciones</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Tu API personal</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Consulta tus productos monitoreados desde tus propias herramientas de forma segura.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">Gestión de API Key</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Usa esta clave para autenticar tus peticiones.</p>
                </div>
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Tu clave actual
                <input
                  type="text"
                  readOnly
                  value={cargandoClave ? 'Cargando...' : apiKey}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copiarClave}
                  disabled={!apiKey || cargandoClave}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copiado ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiado ? 'Copiada' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={regenerarClave}
                  disabled={regenerando || cargandoClave}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerando ? 'animate-spin' : ''}`} />
                  {regenerando ? 'Regenerando...' : 'Regenerar clave'}
                </button>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Al regenerarla, la clave anterior dejará de funcionar inmediatamente.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-emerald-700" />
                <h2 className="font-bold text-slate-900">Ejemplo de consumo</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">Autentica la petición enviando tu clave en el header.</p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-300"><code>{`curl -X GET "${API_BASE}/v1/mis-productos" \\
  -H "X-API-Key: TU_API_KEY"`}</code></pre>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-emerald-400" />
                <div>
                  <h2 className="font-bold text-white">Respuesta en vivo</h2>
                  <p className="text-xs text-slate-400">GET /v1/mis-productos</p>
                </div>
              </div>
              {cargandoProductos && <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />}
            </div>
            <pre className="min-h-[420px] overflow-auto p-5 text-xs leading-6 text-slate-300"><code>{json || 'Consultando tus productos...'}</code></pre>
          </section>
        </div>
      </div>
    </main>
  );
}
