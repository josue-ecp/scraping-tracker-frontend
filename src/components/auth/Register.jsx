import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await registrar({
        name: nombre,
        email,
        password,
        password_confirmation: passwordConfirmacion,
      });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
      <div className="mb-7">
        <p className="text-sm font-semibold text-emerald-700">Empieza a monitorear</p>
        <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Crea tu cuenta</h1>
        <p className="mt-2 text-sm text-slate-500">Guarda productos y consulta sus cambios de precio.</p>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Nombre
          <span className="relative mt-1.5 block">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              maxLength={255}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Correo electrónico
          <span className="relative mt-1.5 block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Contraseña
          <span className="relative mt-1.5 block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={mostrarPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword((actual) => !actual)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
            >
              {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Confirmar contraseña
          <input
            type={mostrarPassword ? 'text' : 'password'}
            name="password_confirmation"
            autoComplete="new-password"
            required
            minLength={8}
            value={passwordConfirmacion}
            onChange={(event) => setPasswordConfirmacion(event.target.value)}
            placeholder="Repite tu contraseña"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800">Iniciar sesión</Link>
      </p>
    </section>
  );
}
