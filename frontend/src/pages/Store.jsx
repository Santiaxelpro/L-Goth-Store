import { useState, useMemo } from 'react'
import { useProducts } from '../hooks/useProducts'
import Header from '../components/Header'
import ProductGrid from '../components/ProductGrid'
import Cart from '../components/Cart'

function Store() {
  const { products, loading, error } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [cartOpen, setCartOpen] = useState(false)

  const categories = useMemo(() => {
    const cats = [
      'Todas',
      ...new Set(products.map((p) => p.categoria).filter(Boolean)),
    ]
    return cats
  }, [products])

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter((p) => p.categoria === selectedCategory)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.descripcion.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [products, selectedCategory, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-goth-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-bone-400/60 font-gothic text-sm tracking-wider">
            Cargando desde las sombras...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center p-8">
          <span className="text-4xl text-blood-400/50 block mb-4" aria-hidden="true">
            &#9768;
          </span>
          <p className="text-blood-400 font-gothic text-lg">
            Error al cargar productos
          </p>
          <p className="text-bone-400/40 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCartClick={() => setCartOpen(true)}
      />

      {/* Announcement Bar */}
      <div
        className="bg-blood-900/30 border-b border-blood-700/20 text-center py-2 px-4"
        role="complementary"
        aria-label="Anuncio"
      >
        <p className="text-bone-300/70 text-xs md:text-sm font-body tracking-wide">
          <span aria-hidden="true">&#9670;</span> Envío gratis en pedidos
          superiores a S/30 <span aria-hidden="true">&#9670;</span>
        </p>
      </div>

      {/* Hero Section */}
      <section
        className="relative py-16 md:py-24 overflow-hidden"
        aria-labelledby="heroHeading"
      >
        <div
          className="absolute inset-0 bg-glow-purple opacity-50"
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-goth-500/40" />
            <span className="text-goth-400 text-xl">&#9768;</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-goth-500/40" />
          </div>

          <h1
            id="heroHeading"
            className="text-4xl md:text-6xl lg:text-7xl font-decorative font-bold text-bone-100 leading-tight tracking-wide"
          >
            <span className="block">Oscuridad</span>
            <span className="block text-goth-300">con Estilo</span>
          </h1>

          <p className="text-bone-300/60 text-sm md:text-base mt-6 max-w-xl mx-auto leading-relaxed">
            Explora nuestra colección gótica con diseños únicos para quienes
            abrazan la noche. Prendas que cuentan historias de sombras y
            elegancia eterna.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-goth-500/30" />
            <span className="text-goth-600/50 text-sm">
              &#9670; &#9670; &#9670;
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-goth-500/30" />
          </div>
        </div>
      </section>

      {/* Category Bar */}
      <nav
        className="bg-abyss/80 backdrop-blur-sm border-b border-goth-600/20 sticky top-[65px] z-30"
        aria-label="Filtrar por categoría"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-goth-600 text-bone-100 border border-goth-400/40 shadow-[0_0_10px_rgba(75,0,130,0.3)]'
                  : 'bg-midnight text-bone-400/60 border border-goth-700/30 hover:border-goth-600/50 hover:text-bone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Products Grid */}
      <main id="mainContent" className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {filteredProducts.length > 0 && (
          <p className="text-bone-400/40 text-xs mb-6">
            Mostrando {filteredProducts.length} de {products.length} productos
          </p>
        )}
        <ProductGrid products={filteredProducts} />
      </main>

      {/* Footer */}
      <footer
        className="bg-abyss border-t border-goth-600/20 mt-auto"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <span className="text-xl font-decorative font-bold text-goth-400 tracking-wider">
                L-GOTH STORE
              </span>
              <p className="text-bone-400/40 text-xs mt-1">
                Moda Gótica Alternativa
              </p>
            </div>

            <nav aria-label="Enlaces del pie de página" className="flex gap-6">
              <a
                href="/"
                className="text-bone-400/40 hover:text-bone-300 text-xs font-body transition-colors"
              >
                Inicio
              </a>
              <a
                href="/#catalogo"
                className="text-bone-400/40 hover:text-bone-300 text-xs font-body transition-colors"
              >
                Catálogo
              </a>
              <a
                href="/admin"
                className="text-bone-400/40 hover:text-goth-300 text-xs font-body transition-colors"
              >
                Admin
              </a>
            </nav>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6" aria-hidden="true">
            <span className="h-px w-8 bg-goth-700/30" />
            <span className="text-goth-700/40 text-xs">&#9670; &#9768; &#9670;</span>
            <span className="h-px w-8 bg-goth-700/30" />
          </div>

          <p className="text-center text-bone-400/20 text-[11px] mt-4">
            &copy; {new Date().getFullYear()} L-Goth Store. Hecho con pasión en
            las sombras.
          </p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-void/60 z-40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <Cart onClose={() => setCartOpen(false)} />
        </>
      )}
    </div>
  )
}

export default Store
