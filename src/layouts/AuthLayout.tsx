import { Outlet, Link } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4 py-12">
      <Link to="/" className="mb-8 font-serif text-2xl font-semibold text-coffee-800">
        ☕ Langka
      </Link>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
