import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { CakeCard } from '../components/CakeCard';
import type { Cake, Order, } from '../types';

type Step = 'select' | 'customize' | 'details' | 'success';

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CustomerFlow() {
  const [step, setStep] = useState<Step>('select');
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Selection state
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);


  // Order details
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(0);
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

  const canGoToDetails = useMemo(() => {
    return selectedCake !== null;
  }, [selectedCake]);

  function pickPremade(cake: Cake) {
    setSelectedCake(cake);
  }

  function goToDetailsFromSelect() {
    if (selectedCake) setStep('details');
  }

  async function submitOrder() {
    if (!customerName || !phone || !pickupDate) {
      setError('Моля, попълнете име, телефон и дата за вземане.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        customerName,
        phone,
        cakeId: selectedCake?.id,
        quantity,
        notes,
        pickupDate,
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
    setSelectedCake(null);
    setCustomerName('');
    setPhone('');
    setQuantity(1);
    setPickupDate(tomorrowISO());
    setNotes('');
    setConfirmedOrder(null);
    setError(null);
  }

  if (loading) return <div className="page"><p>Зареждане...</p></div>;

  return (
    <div className="page">
      {error && <div className="error-banner">{error}</div>}

      {step === 'select' && (
        <>
          <h1>Изберете торта</h1>
          <p className="subtitle">Изберете вашата торта</p>
          <div className="cake-grid">
            {cakes.map((cake) => (
              <CakeCard
                key={cake.id}
                cake={cake}
                selected={selectedCake?.id === cake.id}
                onSelect={() => pickPremade(cake)}
              />
            ))}
          </div>
          <div className="actions">
            <button className="primary" disabled={!canGoToDetails} onClick={goToDetailsFromSelect}>
              Продължи
            </button>
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <h1>Данни за поръчката</h1>

          <div className="order-summary">
            {(
              <>
                <strong>{selectedCake?.name}</strong> — {selectedCake?.price.toFixed(2)} лв.
              </>
            )}
          </div>

          <label className="field-label" htmlFor="quantity">Количество</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <label className="field-label" htmlFor="customerName">Име</label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Вашето име"
          />

          <label className="field-label" htmlFor="phone">Телефон</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08XX XXX XXX"
          />

          <label className="field-label" htmlFor="pickupDate">Дата за вземане</label>
          <input
            id="pickupDate"
            type="date"
            min={tomorrowISO()}
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />

          <label className="field-label" htmlFor="notes">Бележки (по избор)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="напр. алергии, час на вземане..."
          />

          <div className="actions">
            <button className="secondary" onClick={() => setStep('select')}>
              Назад
            </button>
            <button className="primary" disabled={submitting} onClick={submitOrder}>
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
            Поръчка #{confirmedOrder.id} за <strong>{confirmedOrder.customerName}</strong> ще бъде
            готова на{' '}
            <strong>{new Date(confirmedOrder.pickupDate).toLocaleDateString('bg-BG')}</strong>.
          </p>
          <button className="primary" onClick={startOver}>Нова поръчка</button>
        </div>
      )}
    </div>
  );
}
