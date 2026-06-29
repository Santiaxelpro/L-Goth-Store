import { useCart } from '../context/CartContext'
import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { createOrder } from '../utils/api'

function Cart({ onClose }) {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const closeRef = useRef(null)
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // WhatsApp checkout kept for possible future use.
  // const handleWhatsAppOrder = () => {
  //   const phone = '51933898497'
  //   const message = items
  //     .map(
  //       (item) =>
  //         `- ${item.nombre} x${item.quantity}: S/${(
  //           item.precio * item.quantity
  //         ).toLocaleString('es-PE')}`
  //     )
  //     .join('\n')
  //   const fullMessage = `Hola! Me interesa comprar desde L-Goth Store:\n\n${message}\n\nTotal: S/${total.toLocaleString('es-PE')}`
  //   window.open(
  //     `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`,
  //     '_blank',
  //     'noopener'
  //   )
  // }

  const handleCreateOrder = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setOrderMessage('')

    try {
      const result = await createOrder({
        customer,
        items: items.map((item) => ({
          id: item.id,
          name: item.nombre,
          quantity: item.quantity,
          price: item.precio,
          image: item.imagen,
        })),
        total,
        currency: 'PEN',
        paymentMethod: 'pending',
      })

      clearCart()
      setOrderMessage(`Pedido creado: ${result.orderId}`)
    } catch {
      setOrderMessage('No se pudo crear el pedido. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed right-0 top-0 h-full w-full sm:w-96 bg-abyss/98 backdrop-blur-md border-l border-goth-600/30 z-50 shadow-2xl flex flex-col animate-slide-in-right"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
    >
      <div className="flex items-center justify-between p-4 border-b border-goth-600/20">
        <h2 className="text-lg font-gothic font-semibold text-bone-100 flex items-center gap-2">
          <span aria-hidden="true">&#9670;</span>
          Carrito
          {itemCount > 0 && (
            <span className="text-sm text-bone-400/60 font-body font-normal">
              ({itemCount})
            </span>
          )}
        </h2>
        <button
          ref={closeRef}
          onClick={onClose}
          className="text-bone-400/50 hover:text-bone-100 transition-colors p-1"
          aria-label="Cerrar carrito"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {items.length === 0 ? (
          <div className="text-center mt-12">
            <span className="text-4xl text-goth-600/40 block mb-4" aria-hidden="true">
              &#9670;
            </span>
            <p className="text-bone-400/50 text-lg font-gothic">
              {orderMessage ? 'Pedido recibido' : 'El carrito está vacío'}
            </p>
            <p className="text-bone-400/25 text-sm mt-2">
              {orderMessage || 'Agrega productos para comenzar'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3" role="list" aria-label="Artículos en el carrito">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 bg-midnight/80 rounded-lg p-3 border border-goth-600/20"
              >
                <img
                  src={item.imagen || ''}
                  alt={item.nombre}
                  className="w-16 h-16 object-cover rounded bg-goth-800 shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-bone-100 text-sm font-medium truncate">
                    {item.nombre}
                  </h4>
                  <p className="text-goth-300 text-sm font-semibold mt-0.5">
                    ${(item.precio * item.quantity).toLocaleString('es-PE')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-6 h-6 bg-goth-700 text-bone-300 rounded flex items-center justify-center text-sm hover:bg-goth-600 transition-colors"
                      aria-label={`Reducir cantidad de ${item.nombre}`}
                    >
                      -
                    </button>
                    <span className="text-bone-200 text-sm w-6 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-6 h-6 bg-goth-700 text-bone-300 rounded flex items-center justify-center text-sm hover:bg-goth-600 transition-colors"
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto text-blood-400/70 hover:text-blood-400 text-xs font-medium transition-colors"
                      aria-label={`Eliminar ${item.nombre} del carrito`}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-goth-600/20 p-4">
          <div className="flex justify-between text-bone-100 mb-4">
            <span className="font-gothic font-semibold">Total</span>
            <span className="font-bold text-goth-300 text-lg">
              ${total.toLocaleString('es-PE')}
            </span>
          </div>
          <form onSubmit={handleCreateOrder} className="space-y-3">
            <input
              type="text"
              value={customer.name}
              onChange={(e) => setCustomer((current) => ({ ...current, name: e.target.value }))}
              placeholder="Nombre completo"
              required
              className="w-full px-3 py-2 bg-midnight border border-goth-600/30 rounded-lg text-sm text-bone-100 placeholder:text-bone-400/35 focus:outline-none focus:border-goth-400"
            />
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer((current) => ({ ...current, phone: e.target.value }))}
              placeholder="Celular"
              required
              className="w-full px-3 py-2 bg-midnight border border-goth-600/30 rounded-lg text-sm text-bone-100 placeholder:text-bone-400/35 focus:outline-none focus:border-goth-400"
            />
            <input
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer((current) => ({ ...current, email: e.target.value }))}
              placeholder="Correo"
              className="w-full px-3 py-2 bg-midnight border border-goth-600/30 rounded-lg text-sm text-bone-100 placeholder:text-bone-400/35 focus:outline-none focus:border-goth-400"
            />
            <textarea
              value={customer.address}
              onChange={(e) => setCustomer((current) => ({ ...current, address: e.target.value }))}
              placeholder="Dirección o nota de entrega"
              rows={2}
              className="w-full px-3 py-2 bg-midnight border border-goth-600/30 rounded-lg text-sm text-bone-100 placeholder:text-bone-400/35 focus:outline-none focus:border-goth-400 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-goth-700 hover:bg-goth-600 disabled:opacity-50 text-white rounded-lg
                         transition-all duration-200 font-gothic font-semibold text-sm tracking-wider
                         flex items-center justify-center gap-2
                         hover:shadow-[0_0_20px_rgba(109,66,159,0.2)]"
            >
              <span aria-hidden="true">&#9993;</span>
              {submitting ? 'Creando pedido...' : 'Crear pedido'}
            </button>
            {orderMessage && (
              <p className="text-center text-xs text-bone-300/70">{orderMessage}</p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

export default Cart
