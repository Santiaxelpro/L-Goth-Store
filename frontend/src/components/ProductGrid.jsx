function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20" role="status">
        <span className="text-5xl text-goth-600/40 block mb-4" aria-hidden="true">
          &#9768;
        </span>
        <p className="text-bone-400/50 text-lg font-gothic">
          No se encontraron productos
        </p>
        <p className="text-bone-400/25 text-sm mt-2">
          Intenta con otra búsqueda o categoría
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      role="list"
      aria-label="Lista de productos"
    >
      {products.map((product) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}

import ProductCard from './ProductCard'
export default ProductGrid
