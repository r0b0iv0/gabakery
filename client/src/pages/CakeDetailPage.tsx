import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { CartSummary } from '../components/CartSummary';
import { useCart } from '../contexts/CartContext';
import { CAKE_PIECES_OPTIONS, type Cake, type CakePieces } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import './CakeDetailPage.css';

export function CakeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [cake, setCake] = useState<Cake | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pieces, setPieces] = useState<CakePieces>(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedMessage, setAddedMessage] = useState('');

  useEffect(() => {
    const cakeId = Number(id);

    if (!Number.isInteger(cakeId) || cakeId <= 0) {
      setError('Тортата не е намерена.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    api
      .getCake(cakeId)
      .then(setCake)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAddToCart() {
    if (!cake) return;

    addToCart(cake, quantity, pieces);
    setAddedMessage(`Добавено в кошницата: ${quantity} торти по ${pieces} парчета.`);
  }

  if (loading) {
    return (
      <div className="page cake-detail-page">
        <p>Зареждане...</p>
      </div>
    );
  }

  if (error || !cake) {
    return (
      <div className="page cake-detail-page">
        <div className="error-banner">{error || 'Тортата не е намерена.'}</div>
        <button type="button" className="secondary" onClick={() => navigate('/order')}>
          Обратно към тортите
        </button>
      </div>
    );
  }

  return (
    <div className="page cake-detail-page">
      <button
        type="button"
        className="cake-detail-back"
        onClick={() => navigate('/order')}
      >
        ← Обратно към тортите
      </button>

      <section className="cake-detail-card">
        {cake.imageUrl ? (
          <img className="cake-detail-image" src={cake.imageUrl} alt={cake.name} />
        ) : (
          <div className="cake-detail-image cake-detail-image-fallback" aria-hidden="true">
            {cake.emoji}
          </div>
        )}

        <div className="cake-detail-info">
          <p className="cake-detail-eyebrow">GaBakery</p>
          <h1>{cake.name}</h1>
          <p className="cake-detail-description">{cake.description}</p>
          <p className="cake-detail-price">{formatCurrency(cake.price * pieces / 8)}</p>

          <div className="cake-detail-order-controls">
            <label className="cake-detail-quantity" htmlFor="cake-pieces">
              <span>Размер</span>
              <select
                id="cake-pieces"
                value={pieces}
                onChange={(event) => setPieces(Number(event.target.value) as CakePieces)}
              >
                {CAKE_PIECES_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option} парчета</option>
                ))}
              </select>
            </label>
            <div className="cake-detail-quantity">
              <span>Количество</span>
              <div className="quantity-controls">
                <button
                  type="button"
                  className="quantity-button"
                  aria-label="Намали количество"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  className="quantity-button"
                  aria-label="Увеличи количество"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button type="button" className="primary" onClick={handleAddToCart}>
              Добави в кошницата
            </button>
          </div>

          {addedMessage && <p className="cake-added-message" role="status">{addedMessage}</p>}
        </div>
      </section>

      <CartSummary onCheckout={() => navigate('/order', { state: { checkout: true } })} />
    </div>
  );
}
