import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

function loadCart() {
  try {
    const stored = localStorage.getItem('lgoth_cart');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem('lgoth_cart', JSON.stringify(cart));
  } catch {
    // Storage full or unavailable
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIdx = state.findIndex(
        (item) => item.id === action.payload.id
      );
      if (existingIdx !== -1) {
        const updated = [...state];
        const newQty = Math.min(updated[existingIdx].quantity + 1, 10);
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
        return updated;
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((item) => item.id !== action.payload);
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity < 1 || quantity > 10) return state;
      return state.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    }
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        nombre: product.nombre,
        precio: parseFloat(product.precio) || 0,
        imagen: product.imagen
          ? product.imagen.split(',')[0]?.trim()
          : '',
        categoria: product.categoria || '',
        stock: product.stock || 0,
      },
    });
  }, []);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.precio * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, itemCount, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
