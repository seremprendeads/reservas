import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string | null) => void;
  removeItem: (productId: string, size?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, size?: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  currency: string;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'reservas_cart';

function loadCart(): CartItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function cartKey(productId: string, size: string | null): string {
  return `${productId}__${size || ''}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1, size: string | null = null) => {
    setItems(prev => {
      const key = cartKey(product.id, size);
      const existing = prev.find(i => cartKey(i.product.id, i.selected_size) === key);
      if (existing) {
        return prev.map(i =>
          cartKey(i.product.id, i.selected_size) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock), selected_size: size }];
    });
  };

  const removeItem = (productId: string, size: string | null = null) => {
    setItems(prev => prev.filter(i => !(i.product.id === productId && i.selected_size === size)));
  };

  const updateQuantity = (productId: string, quantity: number, size: string | null = null) => {
    if (quantity <= 0) { removeItem(productId, size); return; }
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId && i.selected_size === size ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const currency = items[0]?.product.currency || 'ARS';
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, currency }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
