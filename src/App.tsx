import { Routes, Route } from 'react-router-dom'

import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

import { HomePage } from '@/pages/HomePage'
import { MenuPage } from '@/pages/MenuPage'
import { OrderPage } from '@/pages/OrderPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { ProductsPage } from '@/pages/admin/ProductsPage'
import { CategoriesPage } from '@/pages/admin/CategoriesPage'
import { PromotionsPage } from '@/pages/admin/PromotionsPage'
import { TransactionsPage } from '@/pages/admin/TransactionsPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { SeatingTablesPage } from '@/pages/admin/SeatingTablesPage'
import { EmployeesPage } from '@/pages/admin/EmployeesPage'
import { InventoryPage } from '@/pages/admin/InventoryPage'

export default function App() {
  return (
    <Routes>
      {/* Public (main layout) */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="order" element={<OrderPage />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="admin/login" element={<LoginPage />} />
      </Route>

      {/* Admin (protected) */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="seating-tables" element={<SeatingTablesPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 gap-3">
            <span className="text-5xl">☕</span>
            <h1 className="font-serif text-2xl font-semibold text-stone-800">Page not found</h1>
            <a href="/" className="text-sm text-coffee-700 hover:underline">Go home</a>
          </div>
        }
      />
    </Routes>
  )
}
