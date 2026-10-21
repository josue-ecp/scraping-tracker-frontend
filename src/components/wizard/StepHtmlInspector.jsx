import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MousePointer2, Play } from 'lucide-react';

const FIELDS = ['titulo', 'precioOferta', 'imagen', 'descripcion'];
const FIELD_LABELS = {
  titulo: 'Título',
  precioOferta: 'Precio',
  imagen: 'Imagen',
  descripcion: 'Descripción',
};
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
const IDENTIFYING_ATTRIBUTES = [
  'data-testid',
  'data-test',
  'data-qa',
  'data-cy',
  'itemprop',
  'name',
  'aria-label',
  'title',
];
const SEMANTIC_CLASS = /price|precio|title|titulo|name|nombre|product|producto|description|descripcion|image|imagen|sku|rating|stock|offer|discount|brand|marca/i;

function crearSelectorCss(elemento, documento) {
  if (elemento.id && SAFE_IDENTIFIER.test(elemento.id)) {
    const selectorId = `#${elemento.id}`;
    if (documento.querySelectorAll(selectorId).length === 1) return selectorId;
  }

  const esUnico = (selector) => (
    selector.length <= 256 && documento.querySelectorAll(selector).length === 1
  );
  const clases = Array.from(elemento.classList)
    .filter((clase) => SAFE_IDENTIFIER.test(clase))
    .sort((a, b) => Number(SEMANTIC_CLASS.test(b)) - Number(SEMANTIC_CLASS.test(a)));

  for (const clase of clases) {
    if (esUnico(`.${clase}`)) return `.${clase}`;
  }

  const atributos = Array.from(elemento.attributes)
    .filter(({ name, value }) => (
      (IDENTIFYING_ATTRIBUTES.includes(name) || name.startsWith('data-'))
      && /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(name)
      && value.trim() !== ''
      && value.trim() === value
      && !/["\\\]\r\n]/.test(value)
    ))
    .sort((a, b) => {
      const prioridadA = IDENTIFYING_ATTRIBUTES.indexOf(a.name);
      const prioridadB = IDENTIFYING_ATTRIBUTES.indexOf(b.name);
      return (prioridadA === -1 ? IDENTIFYING_ATTRIBUTES.length : prioridadA)
        - (prioridadB === -1 ? IDENTIFYING_ATTRIBUTES.length : prioridadB);
    });

  for (const { name, value } of atributos) {
    const selectorAtributo = `[${name}="${value}"]`;
    if (esUnico(selectorAtributo)) return selectorAtributo;
    if (esUnico(`${elemento.localName}${selectorAtributo}`)) {
      return `${elemento.localName}${selectorAtributo}`;
    }
  }

  for (const clase of clases) {
    if (esUnico(`${elemento.localName}.${clase}`)) return `${elemento.localName}.${clase}`;
  }

  const clasesParaCombinar = clases.slice(0, 10);
  for (let i = 0; i < clasesParaCombinar.length; i++) {
    for (let j = i + 1; j < clasesParaCombinar.length; j++) {
      const selectorClase = `.${clasesParaCombinar[i]}.${clasesParaCombinar[j]}`;
      if (esUnico(selectorClase)) return selectorClase;
      const selectorConEtiqueta = `${elemento.localName}${selectorClase}`;
      if (esUnico(selectorConEtiqueta)) return selectorConEtiqueta;
    }
  }

  if (clases.length > 1) {
    const selectorClases = `.${clases.join('.')}`;
    if (esUnico(selectorClases)) return selectorClases;
  }

  const segmentos = [];
  let actual = elemento;
  while (actual && actual.nodeType === 1) {
    const tipo = actual.localName;
    const posicion = Array.from(actual.parentElement?.children || [])
      .filter((hermano) => hermano.localName === tipo)
      .indexOf(actual) + 1;
    segmentos.unshift(`${tipo}:nth-of-type(${posicion})`);

    const selector = segmentos.join(' > ');
    if (documento.querySelectorAll(selector).length === 1) return selector;
    actual = actual.parentElement;
  }

  return segmentos.join(' > ');
}

export default function StepHtmlInspector({
  formulario,
  setFormulario,
  htmlExtraido,
  htmlPrevisualizacion,
  metadatos,
  manejarProbarSelectores,
  probandoSelectores,
  errorPrueba,
}) {
  const [campoActivo, setCampoActivo] = useState(FIELDS[0]);
  const [errorSeleccion, setErrorSeleccion] = useState('');
  const iframeRef = useRef(null);
  const elementoResaltadoRef = useRef(null);
  const elementoSeleccionadoRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    let documento = null;
    const estilosPrevios = new WeakMap();

    const restaurarEstilo = (elemento) => {
      if (!elemento) return;
      const estilo = estilosPrevios.get(elemento);
      if (!estilo) return;
      elemento.style.setProperty('outline', estilo.outline, estilo.outlinePrioridad);
      elemento.style.setProperty('outline-offset', estilo.outlineOffset, estilo.outlineOffsetPrioridad);
      estilosPrevios.delete(elemento);
    };
    const resaltar = (elemento, color) => {
      if (!estilosPrevios.has(elemento)) {
        estilosPrevios.set(elemento, {
          outline: elemento.style.getPropertyValue('outline'),
          outlinePrioridad: elemento.style.getPropertyPriority('outline'),
          outlineOffset: elemento.style.getPropertyValue('outline-offset'),
          outlineOffsetPrioridad: elemento.style.getPropertyPriority('outline-offset'),
        });
      }
      elemento.style.setProperty('outline', `2px solid ${color}`, 'important');
      elemento.style.setProperty('outline-offset', '2px', 'important');
    };
    const obtenerElementoHtml = (target) => {
      const ElementClass = documento.defaultView?.Element;
      let elemento = ElementClass && target instanceof ElementClass
        ? target
        : target.parentElement;
      while (elemento && elemento.namespaceURI !== HTML_NAMESPACE) {
        elemento = elemento.parentElement;
      }
      return elemento;
    };

    const manejarHover = (event) => {
      const elemento = obtenerElementoHtml(event.target);
      if (!elemento || elemento === elementoSeleccionadoRef.current) return;
      if (elementoResaltadoRef.current !== elemento) {
        restaurarEstilo(elementoResaltadoRef.current);
        elementoResaltadoRef.current = elemento;
      }
      resaltar(elemento, '#10b981');
    };
    const quitarHover = (event) => {
      const elemento = obtenerElementoHtml(event.target);
      if (elemento && elemento !== elementoSeleccionadoRef.current) {
        restaurarEstilo(elemento);
        if (elementoResaltadoRef.current === elemento) elementoResaltadoRef.current = null;
      }
    };
    const seleccionarElemento = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const elemento = obtenerElementoHtml(event.target);
      if (!elemento || ['html', 'head', 'body'].includes(elemento.localName)) return;

      const selector = crearSelectorCss(elemento, documento);
      if (!selector || selector.length > 256) {
        setErrorSeleccion('No se pudo crear un selector CSS corto para ese elemento. Prueba con uno más específico.');
        return;
      }

      restaurarEstilo(elementoSeleccionadoRef.current);
      if (elementoResaltadoRef.current !== elemento) restaurarEstilo(elementoResaltadoRef.current);
      elementoSeleccionadoRef.current = elemento;
      elementoResaltadoRef.current = null;
      resaltar(elemento, '#059669');

      const atributo = elemento.localName === 'img' ? 'src' : '';
      setErrorSeleccion('');
      setFormulario((actual) => ({
        ...actual,
        selectores: {
          ...actual.selectores,
          [campoActivo]: {
            ...actual.selectores[campoActivo],
            selector,
            atributo,
            valor: '',
          },
        },
      }));
    };

    const conectarInspector = () => {
      const nuevoDocumento = iframe.contentDocument;
      if (!nuevoDocumento || nuevoDocumento === documento) return;

      if (documento) {
        documento.removeEventListener('mouseover', manejarHover, true);
        documento.removeEventListener('mouseout', quitarHover, true);
        documento.removeEventListener('click', seleccionarElemento, true);
      }

      documento = nuevoDocumento;
      documento.addEventListener('mouseover', manejarHover, true);
      documento.addEventListener('mouseout', quitarHover, true);
      documento.addEventListener('click', seleccionarElemento, true);
    };

    iframe.addEventListener('load', conectarInspector);
    conectarInspector();

    return () => {
      iframe.removeEventListener('load', conectarInspector);
      documento?.removeEventListener('mouseover', manejarHover, true);
      documento?.removeEventListener('mouseout', quitarHover, true);
      documento?.removeEventListener('click', seleccionarElemento, true);
      restaurarEstilo(elementoResaltadoRef.current);
      restaurarEstilo(elementoSeleccionadoRef.current);
      elementoResaltadoRef.current = null;
      elementoSeleccionadoRef.current = null;
    };
  }, [campoActivo, htmlPrevisualizacion, setFormulario]);

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
    <div className="space-y-5">
      <div className="border-b pb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Inspector HTML y selectores</h2>
          <p className="mt-1 text-xs text-gray-500">
            Edita los nombres de los campos y selecciona elementos directamente en la vista previa.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <section className="w-full min-w-0 space-y-4 md:w-1/2" aria-label="Configuración de campos y selectores">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
            Cambia libremente la etiqueta de cada dato. Selecciona un campo aquí y haz clic en su elemento dentro de la vista previa.
          </div>

          {FIELDS.map((campo) => {
            const definicion = formulario.selectores?.[campo] || {
              etiqueta: campo,
              selector: '',
              atributo: '',
              valor: '',
            };

            return (
              <section
                key={campo}
                className={`space-y-2 rounded-xl border p-3 ${
                  campoActivo === campo ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'
                }`}
              >
                <label className="block text-sm font-semibold text-gray-700">
                  Etiqueta
                  <input
                    type="text"
                    value={definicion.etiqueta || ''}
                    onChange={(event) => cambiarSelector(campo, 'etiqueta', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={100}
                    aria-label={`Etiqueta para ${FIELD_LABELS[campo]}`}
                  />
                </label>
                <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
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
                <button
                  type="button"
                  onClick={() => setCampoActivo(campo)}
                  aria-pressed={campoActivo === campo}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    campoActivo === campo
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {campoActivo === campo ? 'Campo activo para selección' : `Seleccionar ${definicion.etiqueta || FIELD_LABELS[campo]}`}
                </button>
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
        </section>

        <section className="w-full min-w-0 space-y-3 md:w-1/2" aria-label="Vista previa interactiva">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Vista previa segura</span>
            <span className="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-700">
              {metadatos?.bytesHtml ?? new Blob([htmlExtraido || '']).size} bytes
            </span>
          </div>
          <div className="grid gap-1 text-xs text-gray-500">
            <span>Sitio: {metadatos?.sitio || '—'}</span>
            <span className="truncate">Título: {metadatos?.tituloDocumento || '—'}</span>
          </div>
          <p className="flex items-center gap-2 text-xs text-gray-600">
            <MousePointer2 className="h-4 w-4 shrink-0" />
            Pasa el mouse para resaltar. Haz clic para asignar al campo «{formulario.selectores?.[campoActivo]?.etiqueta || FIELD_LABELS[campoActivo]}».
          </p>
          {errorSeleccion && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorSeleccion}</p>
          )}
          <iframe
            ref={iframeRef}
            title="Vista previa interactiva de la página"
            srcDoc={htmlPrevisualizacion}
            sandbox="allow-same-origin"
            className="h-[36rem] w-full rounded-xl border border-gray-300 bg-white"
          />
          {!htmlPrevisualizacion && (
            <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              No se recibió una vista previa segura. Vuelve al paso del enlace y analiza la página de nuevo.
            </p>
          )}
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-gray-600">Ver HTML original como texto</summary>
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-emerald-300">
              {htmlExtraido || 'No se recibió contenido HTML.'}
            </pre>
          </details>
          <p className="text-xs text-gray-500">
            Los scripts y las referencias a recursos externos se eliminan o bloquean en la vista previa.
          </p>
        </section>
      </div>
    </div>
  );
}
