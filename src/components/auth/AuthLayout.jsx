import { Activity } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-3 py-6 sm:px-4 sm:py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-teal-100/70 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <Link to="/login" className="mb-5 flex items-center justify-center gap-2 sm:mb-7 sm:gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">ScraperTracker</span>
        </Link>
        <Outlet />
        <p className="mt-6 text-center text-xs text-slate-400">Monitorea precios con confianza.</p>
      </div>
    </main>
  );
}
