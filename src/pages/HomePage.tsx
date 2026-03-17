import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/Button'

const FEATURES = [
  { icon: '☕', title: 'Freshly Roasted', desc: 'Single-origin beans roasted in small batches daily.' },
  { icon: '👨‍🍳', title: 'Expert Baristas', desc: 'Crafted by passionate baristas with years of experience.' },
  { icon: '⚡', title: 'Order Ahead', desc: 'Skip the wait — order on your phone, pick up ready.' },
]

export function HomePage() {
  const { data, isLoading } = useProducts({ limit: 4 })
  const featured = data?.data ?? []

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-coffee-800 text-white">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-32">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-coffee-300">
              Premium Coffee Experience
            </p>
            <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Start your day<br />with a perfect cup
            </h1>
            <p className="mb-8 text-base text-coffee-200 leading-relaxed">
              Handcrafted drinks made with the finest ingredients — available fresh, fast, and made just for you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/menu">
                <Button size="lg">
                  View Menu <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-start gap-3">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-stone-800">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Drinks */}
      <section className="bg-cream-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-coffee-600">
                On the menu
              </p>
              <h2 className="font-serif text-2xl font-semibold text-stone-800 md:text-3xl">
                Featured Menu
              </h2>
            </div>
            <Link
              to="/menu"
              className="hidden items-center gap-1.5 text-sm font-medium text-coffee-700 hover:text-coffee-800 md:flex"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} canAdd={false} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link to="/menu">
              <Button variant="secondary">View full menu</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-coffee-800 py-16 text-white">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="mb-4 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-coffee-300 text-coffee-300" />
            ))}
          </div>
          <h2 className="mb-4 font-serif text-2xl font-semibold md:text-3xl">
            Discover More Drinks
          </h2>
          <p className="mb-8 text-coffee-200">
            Browse the full menu and scan the QR on your table when you're ready to order.
          </p>
          <Link to="/menu">
            <Button size="lg">
              View Full Menu <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
