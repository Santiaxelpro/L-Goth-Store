import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../utils/api'

const STORAGE_KEY = 'products'

function getStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch {
  }
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWEwZTIwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZkNDI5ZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkwtR09USDwvdGV4dD48L3N2Zz4='

function normalizeProducts(rawProducts) {
  if (!Array.isArray(rawProducts)) return []

  return rawProducts.map((p, index) => ({
    id: p.id ?? index,
    nombre: p.nombre ?? p.name ?? 'Sin nombre',
    descripcion: p.descripcion ?? p.description ?? '',
    categoria: p.categoria ?? p.category ?? 'General',
    precio: Number(p.precio ?? p.current_price ?? 0),
    precio_anterior: p.precio_anterior
      ? Number(p.precio_anterior)
      : p.previous_price
        ? Number(p.previous_price)
        : null,
    stock: Number(p.stock ?? 0),
    images: Array.isArray(p.images) ? p.images : (p.imagen ? [p.imagen] : [PLACEHOLDER]),
    imagen: p.imagen ?? (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : PLACEHOLDER),
  }))
}

export function useProducts() {
  const [products, setProducts] = useState(() => {
    const stored = getStoredProducts()
    return normalizeProducts(stored ?? [])
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAndUpdate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const raw = await fetch(`${API_URL}/products`).then((r) => r.json())
      const normalized = normalizeProducts(raw)
      setProducts(normalized)
      storeProducts(normalized)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message || 'No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAndUpdate()
  }, [fetchAndUpdate])

  return { products, loading, error, refresh: fetchAndUpdate }
}
