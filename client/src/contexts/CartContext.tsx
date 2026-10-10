import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cake } from '../types';

export type CartItem = {
  cake: Cake;
  quantity: number;
};

type CartContextValue = {
  cart: CartItem[];
  cartTotal: number;
  addToCart: (cake: Cake, quantity?: number) => void;
  increaseQuantity: (cakeId: number) => void;
  decreaseQuantity: (cakeId: number) => void;
  removeFromCart: (cakeId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(cake: Cake, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.cake.id === cake.id);

      if (existing) {
        return current.map((item) =>
          item.cake.id === cake.id
            ? { ...item, cake, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...current, { cake, quantity }];
    });
  }

  function increaseQuantity(cakeId: number) {
    setCart((current) =>
      current.map((item) =>
        item.cake.id === cakeId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseQuantity(cakeId: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.cake.id === cakeId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(cakeId: number) {
    setCart((current) => current.filter((item) => item.cake.id !== cakeId));
  }

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.cake.price * item.quantity, 0),
    [cart],
  );

  const value = useMemo(
    () => ({ cart, cartTotal, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart: () => setCart([]) }),
    [cart, cartTotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return context;
}
