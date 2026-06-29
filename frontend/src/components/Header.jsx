import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

function Header({ searchTerm, onSearchChange, onCartClick }) {
  const { itemCount } = useCart()

  return (
    <header
      className="bg-abyss/95 backdrop-blur-md border-b border-goth-600/30 sticky top-0 z-40"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 group"
          aria-label="L-Goth Store — Ir al inicio"
        >
          <span
            className="text-3xl font-unifraktur text-goth-400 group-hover:text-goth-300 transition-colors"
            aria-hidden="true"
          >
            L
          </span>
          <div className="hidden sm:block">
            <span className="text-lg font-gothic font-bold text-bone-100 tracking-widest">
              L-GOTH STORE
            </span>
            <span className="block text-[10px] text-bone-400/50 tracking-[0.3em] uppercase">
              Moda Gótica Alternativa
            </span>
          </div>
        </Link>

        <div className="flex-1 max-w-md">
          <label htmlFor="searchProducts" className="sr-only">
            Buscar productos
          </label>
          <div className="relative">
            <input
              id="searchProducts"
              type="search"
              placeholder="Buscar en las sombras..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-midnight border border-goth-600/40 rounded-lg
                         text-lumen placeholder-bone-400/30 font-body text-sm
                         focus:border-goth-400 focus:outline-none focus:ring-1 focus:ring-goth-500/50
                         transition-all duration-200"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-bone-400/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-gothic font-semibold
                       text-bone-400/60 hover:text-goth-300 border border-goth-600/30 rounded-lg
                       hover:border-goth-500/50 transition-all duration-200 uppercase tracking-wider"
            aria-label="Panel de administración"
          >
            <span aria-hidden="true">&#9768;</span>
            Admin
          </Link>

          <button
            onClick={onCartClick}
            className="relative p-2 text-bone-300 hover:text-goth-300 transition-colors"
            aria-label={`Carrito de compras, ${itemCount} artículos`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            {itemCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 bg-blood-600 text-white text-[10px] font-bold
                           rounded-full flex items-center justify-center animate-fade-in"
                aria-hidden="true"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
