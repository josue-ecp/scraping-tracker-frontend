import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute() {
  const { autenticado, cargando, errorSesion, reintentarSesion } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm" role="status">
          Verificando sesión segura...
        </div>
      </main>
    );
  }

  if (errorSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="font-bold text-slate-900">No se pudo validar tu sesión</h1>
          <p className="mt-2 text-sm text-slate-600">{errorSesion}</p>
          <button
            type="button"
            onClick={reintentarSesion}
            className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
