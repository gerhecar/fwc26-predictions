import Link from 'next/link'
import WelcomeLanding from '@/images/WelcomeLanding.png'

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${WelcomeLanding.src})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-fifa-navy/60 via-fifa-navy/20 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-4 sm:px-10">
          <span className="text-lg font-bold text-white"></span>
          <div className="flex gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-fifa-gold px-4 py-2 text-sm font-medium text-fifa-navy transition-colors hover:bg-yellow-400"
            >
              Registrarse
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-6 sm:px-10">
          <h1
            className="mt-10 max-w-4xl text-6xl leading-none tracking-wider text-white sm:mt-16 sm:text-8xl lg:text-9xl"
            style={{ fontFamily: 'var(--font-bebas)' }}
          >
            THE BIGGEST STAGE IN R&D SPAIN IS SET
          </h1>

          <div className="flex-1" />

          <div className="mb-12 max-w-xl sm:mb-20">
            <h2
              className="text-4xl leading-tight text-white sm:text-5xl whitespace-nowrap"
              style={{ fontFamily: 'var(--font-bebas)' }}
            >
              Predice el Mundial FIFA 2026
            </h2>
            <p className="mt-4 text-base text-blue-200 sm:text-lg">
              Arma tu bracket, elige al campeón y compite con tus amigos.
            </p>
            <Link
              href="/auth/register"
              className="mt-8 inline-block w-full rounded-xl bg-fifa-gold px-8 py-3 text-center text-lg font-bold text-fifa-navy shadow-lg transition-transform hover:scale-105 sm:w-auto"
            >
              Comenzar ahora
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
