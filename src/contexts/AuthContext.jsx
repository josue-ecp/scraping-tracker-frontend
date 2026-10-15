import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, borrarToken, guardarToken, obtenerToken } from '../lib/api';
import AuthContext from './auth-context';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()));
  const [errorSesion, setErrorSesion] = useState('');

  const cargarUsuario = useCallback(async () => {
    const token = obtenerToken();
    if (!token) return;
    try {
      const resultado = await apiRequest('/user');
      setUsuario(resultado.usuario);
    } catch (error) {
      if (error.status === 401) {
        borrarToken();
        setUsuario(null);
        setErrorSesion('');
      } else {
        setErrorSesion(error.message || 'No se pudo verificar la sesión.');
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const manejarSesionExpirada = () => {
      borrarToken();
      setUsuario(null);
      setErrorSesion('');
      setCargando(false);
    };
    window.addEventListener('scrapertracker:unauthorized', manejarSesionExpirada);
    const temporizador = window.setTimeout(cargarUsuario, 0);
    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener('scrapertracker:unauthorized', manejarSesionExpirada);
    };
  }, [cargarUsuario]);

  const reintentarSesion = useCallback(async () => {
    if (!obtenerToken()) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    setCargando(true);
    setErrorSesion('');
    await cargarUsuario();
  }, [cargarUsuario]);

  const iniciarSesion = useCallback(async (credenciales) => {
    const resultado = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credenciales),
    });
    guardarToken(resultado.token);
    setUsuario(resultado.usuario);
    setErrorSesion('');
  }, []);

  const registrar = useCallback(async (datos) => {
    const resultado = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    guardarToken(resultado.token);
    setUsuario(resultado.usuario);
    setErrorSesion('');
  }, []);

  const cerrarSesion = useCallback(async () => {
    await apiRequest('/logout', { method: 'POST' });
    borrarToken();
    setUsuario(null);
    setErrorSesion('');
  }, []);

  const value = useMemo(() => ({
    usuario,
    autenticado: Boolean(usuario),
    cargando,
    errorSesion,
    iniciarSesion,
    registrar,
    cerrarSesion,
    reintentarSesion,
  }), [usuario, cargando, errorSesion, iniciarSesion, registrar, cerrarSesion, reintentarSesion]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
