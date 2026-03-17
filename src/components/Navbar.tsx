import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const itemCount = useCartStore((s) => s.itemCount())
  const isOrderPath = location.pathname.startsWith('/order')

  const seatingTableId = searchParams.get('seating_table_id')
  const tableQuery = seatingTableId ? `?seating_table_id=${encodeURIComponent(seatingTableId)}` : ''

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: `/menu${tableQuery}`, label: 'Menu' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link to="/" className="font-serif text-xl font-semibold text-coffee-800">
          ☕ Langka
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'text-sm font-medium text-coffee-700'
                  : 'text-sm text-stone-500 transition-colors hover:text-stone-800'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Cart appears only on order flow */}
          {isOrderPath && (
            <Link
              to={`/order${tableQuery}`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-cream-100"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coffee-700 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-cream-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-stone-100 px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  'block py-2.5 text-sm',
                  isActive ? 'font-medium text-coffee-700' : 'text-stone-600',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
