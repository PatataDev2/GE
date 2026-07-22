import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-8xl font-bold text-slate-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-700 mb-2">P{'\u00E1'}gina no encontrada</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        La p{'\u00E1'}gina que buscas no existe o ha sido movida.
        Verifica la URL o regresa al inicio.
      </p>
      <Link to="/" className="btn btn-primary">
        Volver al Inicio
      </Link>
    </div>
  );
}
