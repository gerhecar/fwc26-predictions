import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-fifa-navy to-fifa-blue">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold text-white">FWC 2026</span>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-fifa-gold px-4 py-2 text-sm font-medium text-fifa-navy hover:bg-yellow-400"
          >
            Registrarse
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          Predice el Mundial FIFA 2026
        </h1>
        <p className="mt-4 max-w-lg text-lg text-blue-200">
          Arma tu bracket, elige al campeón y compite con tus amigos.
        </p>
        <Link
          href="/auth/register"
          className="mt-8 rounded-xl bg-fifa-gold px-8 py-3 text-lg font-bold text-fifa-navy shadow-lg transition-transform hover:scale-105"
        >
          Comenzar ahora
        </Link>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-6 text-white">
            <div className="text-3xl">📋</div>
            <h3 className="mt-2 font-semibold">Predice Grupos</h3>
            <p className="mt-1 text-sm text-blue-200">Rankea los equipos del 1° al 4° en cada grupo</p>
          </div>
          <div className="rounded-xl bg-white/10 p-6 text-white">
            <div className="text-3xl">🏆</div>
            <h3 className="mt-2 font-semibold">Arma tu Llave</h3>
            <p className="mt-1 text-sm text-blue-200">Elige quién avanza hasta la final</p>
          </div>
          <div className="rounded-xl bg-white/10 p-6 text-white">
            <div className="text-3xl">👥</div>
            <h3 className="mt-2 font-semibold">Compite</h3>
            <p className="mt-1 text-sm text-blue-200">Crea grupos con amigos y gana el primer lugar</p>
          </div>
        </div>
      </main>
    </div>
  )
}
