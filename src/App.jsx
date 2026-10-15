import { useState } from 'react';
import { Activity, ChartNoAxesCombined, LogOut, Menu, Plus, ScanSearch, X } from 'lucide-react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import Register from './components/auth/Register';
import DashboardProductos from './components/dashboard/DashboardProductos';
import ScraperWizard from './components/wizard/ScraperWizard';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

function BarraNavegacion() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const manejarCierre = async () => {
    setError('');
    setCerrando(true);
    try {
      await cerrarSesion();
      setMenuAbierto(false);
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(logoutError.message || 'No se pudo cerrar la sesión. Intenta de nuevo.');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight text-slate-900">ScraperTracker</span>
              <span className="hidden text-xs text-slate-500 sm:block">Monitoreo inteligente de productos</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="navegacion-principal"
            aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav
            id="navegacion-principal"
            aria-label="Navegación principal"
            className={`${menuAbierto ? 'flex' : 'hidden'} w-full flex-col items-stretch gap-1 border-t border-slate-100 pt-3 md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:border-0 md:pt-0`}
          >
            <Link
              to="/"
              onClick={() => setMenuAbierto(false)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <ChartNoAxesCombined className="h-4 w-4" />
              <span className="hidden sm:inline">Monitoreo</span>
            </Link>
            <Link
              to="/wizard"
              onClick={() => setMenuAbierto(false)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4 sm:hidden" />
              <ScanSearch className="hidden h-4 w-4 sm:block" />
              <span>Nuevo rastreo</span>
            </Link>
            <span className="max-w-full truncate px-3 py-2 text-sm font-medium text-slate-600 md:max-w-40 md:border-l md:border-slate-200 md:py-0" title={usuario?.email}>
              {usuario?.name}
            </span>
            <button
              type="button"
              onClick={manejarCierre}
              disabled={cerrando}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span>{cerrando ? 'Saliendo...' : 'Cerrar sesión'}</span>
            </button>
          </nav>
        </div>
      </header>

      {error && (
        <div role="alert" className="mx-auto mt-3 max-w-7xl px-4 text-right text-sm text-red-700 sm:px-6 lg:px-8">
          {error}
        </div>
      )}
      <Outlet />
    </>
  );
}

function WizardPage() {
  const navigate = useNavigate();
  return <ScraperWizard mostrarEncabezado={false} onSaved={() => navigate('/', { replace: true })} />;
}

function DashboardPage() {
  const navigate = useNavigate();
  return <DashboardProductos onCrear={() => navigate('/wizard')} />;
}

function RutasAplicacion() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<BarraNavegacion />}>
          <Route index element={<DashboardPage />} />
          <Route path="/wizard" element={<WizardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RutasAplicacion />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
