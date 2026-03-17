import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
