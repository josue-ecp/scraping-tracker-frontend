export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';
const TOKEN_KEY = 'scrapertracker_token';

export function obtenerToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function guardarToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function borrarToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const token = obtenerToken();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok || result?.exito === false) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('scrapertracker:unauthorized'));
    }
    const validationMessage = result?.errors
      ? Object.values(result.errors).flat().join(' ')
      : '';
    const error = new Error(
      validationMessage || result?.message || result?.mensaje || `La solicitud falló (HTTP ${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }

  return result;
}
