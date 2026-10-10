import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { CakeCard } from '../components/CakeCard';
import { CartSummary } from '../components/CartSummary';
import { useCart } from '../contexts/CartContext';
import type { Cake, Order } from '../types';
import './CustomerFlow.css';

type Step = 'select' | 'details' | 'success';

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CustomerFlow() {
  const location = useLocation();
  const { cart, cartTotal, addToCart, clearCart } = useCart();
  const routeState = location.state as { checkout?: boolean } | null;
  const [step, setStep] = useState<Step>(() =>
    routeState?.checkout && cart.length > 0 ? 'details' : 'select',
  );
  const [cakes, setCakes] = useState<Cake[]>([]);
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

  const canGoToDetails = cart.length > 0;

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
    clearCart();
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

          <CartSummary />

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
