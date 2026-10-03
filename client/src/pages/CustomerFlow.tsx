import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { CakeCard } from '../components/CakeCard';
import type { Cake, Order } from '../types';
import './CustomerFlow.css';

type Step = 'select' | 'details' | 'success';

type CartItem = {
  cake: Cake;
  quantity: number;
};

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CustomerFlow() {
  const [step, setStep] = useState<Step>('select');
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupDate, setPickupDate] = useState(tomorrowISO());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.getCakes()
      .then((cakesRes) => {
        setCakes(cakesRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.cake.price * item.quantity,
      0
    );
  }, [cart]);

  const canGoToDetails = cart.length > 0;

  function addToCart(cake: Cake) {
    setCart(current => {
      const existing = current.find(item => item.cake.id === cake.id);

      if (existing) {
        return current.map(item =>
          item.cake.id === cake.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { cake, quantity: 1 }];
    });
  }

  function increaseQuantity(cakeId: number) {
    setCart(current =>
      current.map(item =>
        item.cake.id === cakeId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(cakeId: number) {
    setCart(current =>
      current
        .map(item =>
          item.cake.id === cakeId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function removeFromCart(cakeId: number) {
    setCart(current =>
      current.filter(item => item.cake.id !== cakeId)
    );
  }

  function goToDetailsFromSelect() {
    if (cart.length > 0) {
      setError(null);
      setStep('details');
    }
  }

  async function submitOrder() {
    if (!customerName || !phone || !pickupDate) {
      setError('Моля, попълнете име, телефон и дата за вземане.');
      return;
    }

    if (cart.length === 0) {
      setError('Добавете поне една торта.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const order = await api.createOrder({
        customerName,
        phone,
        pickupDate,
        notes,
        items: cart.map(item => ({
          cakeId: item.cake.id,
          quantity: item.quantity,
        })),
      });

      setConfirmedOrder(order);
      setStep('success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep('select');
    setCart([]);
    setCustomerName('');
    setPhone('');
    setPickupDate(tomorrowISO());
    setNotes('');
    setConfirmedOrder(null);
    setError(null);
  }

  if (loading) {
    return (
      <div className="page">
        <p>Зареждане...</p>
      </div>
    );
  }

  return (
    <div className="page customer-flow-page">
      {error && <div className="error-banner">{error}</div>}

      {step === 'select' && (
        <>
          <h1>Изберете торти</h1>
          <p className="subtitle">
            Добавете желаните торти във вашата кошница
          </p>

          <div className="cake-grid">
            {cakes.map((cake) => (
              <CakeCard
                key={cake.id}
                cake={cake}
                selected={cart.some(item => item.cake.id === cake.id)}
                onSelect={() => addToCart(cake)}
              />
            ))}
          </div>

          {cart.length > 0 && (
            <div className="cart">
              <div className="cart-header">
                <h2>Кошница</h2>
                <span>
                  {cart.reduce((total, item) => total + item.quantity, 0)} бр.
                </span>
              </div>

              <div className="cart-items">
                {cart.map(item => (
                  <div className="cart-item" key={item.cake.id}>
                    <div className="cart-item-info">
                      <div className="cart-item-name">
                        {item.cake.emoji} {item.cake.name}
                      </div>

                      <div className="cart-item-price">
                        {item.cake.price.toFixed(2)} лв. / бр.
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button
                          type="button"
                          className="quantity-button"
                          onClick={() => decreaseQuantity(item.cake.id)}
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          className="quantity-button"
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
            </div>
          )}

          <div className="actions">
            <button
              className="primary"
              disabled={!canGoToDetails}
              onClick={goToDetailsFromSelect}
            >
              Продължи
            </button>
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <h1>Данни за поръчката</h1>

          <div className="order-summary">
            {cart.map(item => (
              <div className="summary-item" key={item.cake.id}>
                <span>
                  {item.cake.emoji} {item.cake.name} × {item.quantity}
                </span>

                <strong>
                  {(item.cake.price * item.quantity).toFixed(2)} лв.
                </strong>
              </div>
            ))}

            <div className="summary-total">
              <span>Общо</span>
              <strong>{cartTotal.toFixed(2)} лв.</strong>
            </div>
          </div>

          <label className="field-label" htmlFor="customerName">
            Име
          </label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Вашето име"
          />

          <label className="field-label" htmlFor="phone">
            Телефон
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08XX XXX XXX"
          />

          <label className="field-label" htmlFor="pickupDate">
            Дата за вземане
          </label>
          <input
            id="pickupDate"
            type="date"
            min={tomorrowISO()}
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />

          <label className="field-label" htmlFor="notes">
            Бележки (по избор)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="напр. алергии, час на вземане..."
          />

          <div className="actions">
            <button
              className="secondary"
              onClick={() => setStep('select')}
            >
              Назад
            </button>

            <button
              className="primary"
              disabled={submitting}
              onClick={submitOrder}
            >
              {submitting ? 'Изпращане...' : 'Потвърди поръчката'}
            </button>
          </div>
        </>
      )}

      {step === 'success' && confirmedOrder && (
        <div className="success">
          <div className="success-emoji">✅</div>

          <h1>Поръчката е приета!</h1>

          <p>
            Поръчка #{confirmedOrder.id} за{' '}
            <strong>{confirmedOrder.customerName}</strong> ще бъде готова на{' '}
            <strong>
              {new Date(confirmedOrder.pickupDate).toLocaleDateString('bg-BG')}
            </strong>.
          </p>

          <button className="primary" onClick={startOver}>
            Нова поръчка
          </button>
        </div>
      )}
    </div>
  );
}