import React, { useState } from 'react';
import { Link as LinkIcon, FileText, Image as ImageIcon, Settings, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

import StepEnlace from './StepEnlace';
import StepHtmlInspector from './StepHtmlInspector';
import StepGaleria from './StepGaleria';
import StepFrecuencia from './StepFrecuencia';
import StepRevision from './StepRevision';
import { apiRequest } from '../../lib/api';

const crearFormularioInicial = () => ({
  enlace: '',
  titulo: '',
  precioOferta: '',
  precioRegular: '',
  cupon: '',
  disponibilidad: 'Disponible',
  costoEnvio: '0',
  envioDesde: '',
  frecuenciaScraping: '5',
  descripcion: '',
  imagenes: [],
  nuevaImagen: '',
  selectores: {
    titulo: { etiqueta: 'Título', selector: '', atributo: '', valor: '' },
    precioOferta: { etiqueta: 'Precio', selector: '', atributo: '', valor: '' },
    imagen: { etiqueta: 'Imagen', selector: '', atributo: '', valor: '' },
    descripcion: { etiqueta: 'Descripción', selector: '', atributo: '', valor: '' },
  },
});

function normalizarPrecio(valor) {
  let precio = String(valor || '').replace(/[^\d.,-]/g, '');
  if (precio.includes(',') && precio.includes('.')) {
    precio = precio.lastIndexOf('.') > precio.lastIndexOf(',')
      ? precio.replaceAll(',', '')
      : precio.replaceAll('.', '').replace(',', '.');
  } else if (precio.includes(',')) {
    const partes = precio.split(',');
    precio = partes.length === 2 && partes[1].length <= 2
      ? precio.replace(',', '.')
      : precio.replaceAll(',', '');
  }

  if (precio === '') return '';
  const numero = Number(precio);
  return Number.isFinite(numero) ? String(numero) : '';
}

function normalizarUrlImagen(valor, enlaceBase) {
  if (!valor) return '';
  try {
    return new URL(valor, enlaceBase).href;
  } catch {
    return valor;
  }
}

export default function ScraperWizard({ mostrarEncabezado = true, onSaved }) {
  const [pasoActual, setPasoActual] = useState(1);
  const [estaCargando, setEstaCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [probandoSelectores, setProbandoSelectores] = useState(false);
  const [progresoCarga, setProgresoCarga] = useState(0);
  const [textoEstado, setTextoEstado] = useState('');
  const [error, setError] = useState('');
  const [errorPrueba, setErrorPrueba] = useState('');
  const [htmlExtraido, setHtmlExtraido] = useState('');
  const [metadatos, setMetadatos] = useState(null);
  const [formulario, setFormulario] = useState(crearFormularioInicial);

  const pasos = [
    { id: 1, name: 'Enlace', icon: LinkIcon },
    { id: 2, name: 'Inspector HTML / Datos', icon: FileText },
    { id: 3, name: 'Galería de imágenes', icon: ImageIcon },
    { id: 4, name: 'Frecuencia de Monitoreo', icon: Settings },
    { id: 5, name: 'Revisión', icon: CheckCircle2 },
  ];

  const manejarScraping = async (event) => {
    event.preventDefault();
    setError('');
    setEstaCargando(true);
    setProgresoCarga(20);
    setTextoEstado('Conectando con el servidor de scraping...');

    try {
      setProgresoCarga(55);
      setTextoEstado('Descargando HTML y detectando selectores...');
      const resultado = await apiRequest('/productos/extraer', {
        method: 'POST',
        body: JSON.stringify({ enlace: formulario.enlace }),
      });
      const datos = resultado.datos || {};

      setFormulario((actual) => ({
        ...actual,
        titulo: datos.titulo || '',
        precioOferta: normalizarPrecio(datos.precioOferta),
        precioRegular: normalizarPrecio(datos.precioRegular),
        descripcion: datos.descripcion || '',
        imagenes: (datos.imagenes || []).map((imagen) => normalizarUrlImagen(imagen, formulario.enlace)),
        disponibilidad: datos.disponibilidad || 'Disponible',
        selectores: resultado.selectores || actual.selectores,
      }));
      setHtmlExtraido(resultado.html || '');
      setMetadatos(resultado.metadatos || null);
      setProgresoCarga(100);
      setTextoEstado('Página analizada correctamente.');
      setPasoActual(2);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo analizar la página.');
    } finally {
      setEstaCargando(false);
      setProgresoCarga(0);
    }
  };

  const manejarProbarSelectores = async () => {
    setErrorPrueba('');
    setProbandoSelectores(true);

    try {
      const resultado = await apiRequest('/productos/inspeccionar', {
        method: 'POST',
        body: JSON.stringify({
          enlace: formulario.enlace,
          selectores: formulario.selectores,
        }),
      });
      const valores = resultado.valores || {};

      setFormulario((actual) => {
        const imagenDetectada = normalizarUrlImagen(valores.imagen, actual.enlace);
        const imagenes = imagenDetectada && !actual.imagenes.includes(imagenDetectada)
          ? [...actual.imagenes, imagenDetectada]
          : actual.imagenes;

        return {
          ...actual,
          selectores: resultado.selectores,
          titulo: valores.titulo === undefined ? actual.titulo : valores.titulo,
          precioOferta: valores.precioOferta === undefined
            ? actual.precioOferta
            : normalizarPrecio(valores.precioOferta),
          descripcion: valores.descripcion === undefined ? actual.descripcion : valores.descripcion,
          imagenes,
        };
      });
    } catch (requestError) {
      setErrorPrueba(requestError.message || 'No fue posible probar los selectores.');
    } finally {
      setProbandoSelectores(false);
    }
  };

  const guardarProducto = async () => {
    setError('');
    setGuardando(true);

    try {
      const resultado = await apiRequest('/productos', {
        method: 'POST',
        body: JSON.stringify(formulario),
      });
      window.alert(resultado.mensaje || 'Producto guardado y monitoreo activado.');
      setPasoActual(1);
      setFormulario(crearFormularioInicial());
      setHtmlExtraido('');
      setMetadatos(null);
      onSaved?.();
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambio = (event) => {
    const { name, value } = event.target;
    if (name === 'enlace' && value !== formulario.enlace) {
      setFormulario({ ...crearFormularioInicial(), enlace: value });
      setHtmlExtraido('');
      setMetadatos(null);
      setError('');
      return;
    }

    setFormulario((actual) => ({ ...actual, [name]: value }));
  };
  const limpiarEnlace = () => {
    setFormulario(crearFormularioInicial());
    setHtmlExtraido('');
    setMetadatos(null);
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {mostrarEncabezado && (
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-black tracking-wider text-emerald-600">ScraperTracker</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">v2.0 (Maxun Style)</span>
          </div>
          <div className="text-sm font-medium text-gray-500">Configurador y Monitor de Scraping</div>
        </header>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="w-full border-b border-gray-200 bg-white p-3 md:w-72 md:shrink-0 md:border-b-0 md:border-r md:p-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 md:mb-6 md:text-sm">Constructor Web</h2>
          <nav aria-label="Pasos del asistente" className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:space-y-2 md:overflow-visible md:pb-0">
            {pasos.map((paso) => {
              const Icon = paso.icon;
              const activo = pasoActual === paso.id;
              const completado = pasoActual > paso.id;

              return (
                <button
                  key={paso.id}
                  type="button"
                  onClick={() => setPasoActual(paso.id)}
                  disabled={paso.id > pasoActual}
                  aria-current={activo ? 'step' : undefined}
                  aria-label={`Paso ${paso.id}: ${paso.name}${completado ? ', completado' : ''}`}
                  className={`flex min-w-max flex-col items-center gap-1 rounded-xl px-3 py-2 text-center text-[11px] font-medium transition-all md:w-full md:min-w-0 md:flex-row md:gap-3 md:px-4 md:py-3 md:text-left md:text-sm ${
                    activo
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                      : completado
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${activo ? 'text-emerald-600' : completado ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <span className="whitespace-nowrap">{paso.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="mx-auto w-full max-w-4xl flex-1 p-3 sm:p-5 md:p-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-8">
            {pasoActual === 1 && (
              <StepEnlace
                formulario={formulario}
                manejarCambio={manejarCambio}
                manejarScraping={manejarScraping}
                limpiarEnlace={limpiarEnlace}
                estaCargando={estaCargando}
                textoEstado={textoEstado}
                progresoCarga={progresoCarga}
                error={error}
              />
            )}

            {pasoActual === 2 && (
              <StepHtmlInspector
                formulario={formulario}
                setFormulario={setFormulario}
                htmlExtraido={htmlExtraido}
                metadatos={metadatos}
                manejarProbarSelectores={manejarProbarSelectores}
                probandoSelectores={probandoSelectores}
                errorPrueba={errorPrueba}
              />
            )}

            {pasoActual === 3 && <StepGaleria formulario={formulario} setFormulario={setFormulario} />}
            {pasoActual === 4 && <StepFrecuencia formulario={formulario} manejarCambio={manejarCambio} />}
            {pasoActual === 5 && <StepRevision guardarProducto={guardarProducto} guardando={guardando} error={error} />}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5 sm:mt-10 sm:pt-6">
              {pasoActual > 1 ? (
                <button
                  type="button"
                  onClick={() => setPasoActual((actual) => actual - 1)}
                  className="flex cursor-pointer items-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Atrás</span>
                </button>
              ) : <div />}

              {pasoActual > 1 && pasoActual < pasos.length && (
                <button
                  type="button"
                  onClick={() => setPasoActual((actual) => actual + 1)}
                  className="flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 sm:px-6"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
