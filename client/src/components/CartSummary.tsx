import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './CartSummary.css';

type Props = {
  onCheckout?: () => void;
};

export function CartSummary({ onCheckout }: Props) {
  const { cart, cartTotal, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  if (cart.length === 0) return null;

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <section className="cart">
      <div className="cart-header">
        <h2>Кошница</h2>
        <span>{itemCount} бр.</span>
      </div>

      <div className="cart-items">
        {cart.map((item) => (
          <div className="cart-item" key={item.cake.id}>
            <div className="cart-item-info">
              <Link className="cart-item-name" to={`/cakes/${item.cake.id}`}>
                {item.cake.imageUrl ? (
                  <img src={item.cake.imageUrl} alt="" />
                ) : (
                  <span aria-hidden="true">{item.cake.emoji}</span>
                )}
                {item.cake.name}
              </Link>
              <div className="cart-item-price">
                {item.cake.price.toFixed(2)} лв. / бр.
              </div>
            </div>

            <div className="cart-item-actions">
              <div className="quantity-controls">
                <button
                  type="button"
                  className="quantity-button"
                  aria-label={`Намали количеството на ${item.cake.name}`}
                  onClick={() => decreaseQuantity(item.cake.id)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  className="quantity-button"
                  aria-label={`Увеличи количеството на ${item.cake.name}`}
                  onClick={() => increaseQuantity(item.cake.id)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="remove-button"
                onClick={() => removeFromCart(item.cake.id)}
              >
                Премахни
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <span>Общо</span>
        <strong>{cartTotal.toFixed(2)} лв.</strong>
      </div>

      {onCheckout && (
        <div className="cart-checkout-action">
          <button type="button" className="primary" onClick={onCheckout}>
            Продължи към поръчката
          </button>
        </div>
      )}
    </section>
  );
}
