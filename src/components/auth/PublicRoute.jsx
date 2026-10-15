import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function PublicRoute() {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600" role="status">Cargando ScraperTracker...</p>
      </main>
    );
  }

  return autenticado ? <Navigate to="/" replace /> : <Outlet />;
}
