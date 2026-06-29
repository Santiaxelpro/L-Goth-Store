import { useState } from 'react'
import { useCart } from '../context/CartContext'
import ImageCarousel from './ImageCarousel'

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWEwZTIwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZkNDI5ZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkwtR09USDwvdGV4dD48L3N2Zz4='

function ProductCard({ product }) {
  const { addItem } = useCart()
  const [showCarousel, setShowCarousel] = useState(false)
  const [imgError, setImgError] = useState(false)

  const images = Array.isArray(product.images)
    ? product.images
    : product.imagen
      ? product.imagen.split(',').map((url) => url.trim()).filter(Boolean)
      : []

  const mainImage = images.length > 0 ? images[0] : product.imagen || PLACEHOLDER
  const price = parseFloat(product.precio)
  const prevPrice = product.precio_anterior ? parseFloat(product.precio_anterior) : null
  const inStock = product.stock > 0
  const hasDiscount = prevPrice && prevPrice > price

  return (
    <>
      <article
        className="card-goth flex flex-col group"
        aria-labelledby={`product-name-${product.id}`}
      >
        <div
          className="relative aspect-square cursor-pointer overflow-hidden bg-midnight"
          onClick={() => images.length > 1 && setShowCarousel(true)}
          role={images.length > 1 ? 'button' : undefined}
          tabIndex={images.length > 1 ? 0 : undefined}
          aria-label={
            images.length > 1
              ? `Ver ${images.length} imágenes de ${product.nombre}`
              : undefined
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (images.length > 1) setShowCarousel(true)
            }
          }}
        >
          <img
            src={imgError ? PLACEHOLDER : mainImage}
            alt={product.nombre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />

          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-blood-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              OFERTA
            </span>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-void/70 flex items-center justify-center">
              <span className="text-bone-300/80 font-gothic text-sm font-semibold tracking-wider uppercase">
                Agotado
              </span>
            </div>
          )}

          {images.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-void/80 text-bone-300/70 text-[10px] px-2 py-0.5 rounded-full font-body">
              {images.length} fotos
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <span className="text-[11px] text-goth-400 font-medium uppercase tracking-widest">
            {product.categoria}
          </span>

          <h3
            id={`product-name-${product.id}`}
            className="text-bone-100 font-gothic font-semibold text-sm mt-1 truncate"
          >
            {product.nombre}
          </h3>

          <p className="text-bone-400/60 text-xs mt-1 line-clamp-2 leading-relaxed">
            {product.descripcion}
          </p>

          <div className="mt-auto pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-goth-300 font-bold text-lg">
                S/{!isNaN(price) ? price.toLocaleString('es-CO') : 'N/A'}
              </span>
              {hasDiscount && (
                <span className="text-bone-400/40 text-xs line-through">
                  ${prevPrice.toLocaleString('es-CO')}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-[11px] font-medium ${
                  inStock ? 'text-emerald-400/70' : 'text-blood-400/70'
                }`}
              >
                {inStock ? `En stock (${product.stock})` : 'Agotado'}
              </span>
            </div>

            <button
              onClick={() => addItem(product)}
              disabled={!inStock}
              className="w-full mt-3 py-2.5 btn-goth text-xs disabled:bg-goth-800 disabled:text-bone-400/30 disabled:border-goth-700/30"
            >
              {inStock ? 'Agregar al carrito' : 'Agotado'}
            </button>
          </div>
        </div>
      </article>

      {showCarousel && (
        <ImageCarousel
          images={images}
          productName={product.nombre}
          onClose={() => setShowCarousel(false)}
        />
      )}
    </>
  )
}

export default ProductCard
