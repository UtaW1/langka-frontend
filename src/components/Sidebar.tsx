import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Coffee,
  Tag,
  Percent,
  CreditCard,
  QrCode,
  Users,
  UserCog,
  Package,
  LogOut,
  X,
} from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Coffee },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/seating-tables', label: 'Seating Tables', icon: QrCode },
  { to: '/admin/promotions', label: 'Promotions', icon: Percent },
  { to: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/employees', label: 'Employees', icon: UserCog },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const logout = useLogout()

  return (
    <>
      {/* Mobile backdrop */}
      {open && onClose && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-stone-100',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <span className="font-serif text-lg font-semibold text-coffee-800">
            ☕ Langka
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Label */}
        <div className="px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors mb-0.5',
                  isActive
                    ? 'bg-coffee-50 font-medium text-coffee-800'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800',
                ].join(' ')
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-stone-100 p-3">
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
