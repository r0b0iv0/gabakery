import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cake, CakePieces } from '../types';

export type CartItem = {
  cake: Cake;
  quantity: number;
  pieces: CakePieces;
};

type CartContextValue = {
  cart: CartItem[];
  cartTotal: number;
  addToCart: (cake: Cake, quantity?: number, pieces?: CakePieces) => void;
  increaseQuantity: (cakeId: number, pieces: CakePieces) => void;
  decreaseQuantity: (cakeId: number, pieces: CakePieces) => void;
  removeFromCart: (cakeId: number, pieces: CakePieces) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(cake: Cake, quantity = 1, pieces: CakePieces = 8) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.cake.id === cake.id && item.pieces === pieces,
      );

      if (existing) {
        return current.map((item) =>
          item.cake.id === cake.id && item.pieces === pieces
            ? { ...item, cake, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...current, { cake, quantity, pieces }];
    });
  }

  function increaseQuantity(cakeId: number, pieces: CakePieces) {
    setCart((current) =>
      current.map((item) =>
        item.cake.id === cakeId && item.pieces === pieces
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseQuantity(cakeId: number, pieces: CakePieces) {
    setCart((current) =>
      current
        .map((item) =>
          item.cake.id === cakeId && item.pieces === pieces
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(cakeId: number, pieces: CakePieces) {
    setCart((current) =>
      current.filter((item) => item.cake.id !== cakeId || item.pieces !== pieces),
    );
  }

  const cartTotal = useMemo(
    () => cart.reduce(
      (total, item) => total + item.cake.price * (item.pieces / 8) * item.quantity,
      0,
    ),
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
