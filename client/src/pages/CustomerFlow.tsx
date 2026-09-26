import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { CakeCard } from '../components/CakeCard';
import type { Cake, Order, OptionsResponse } from '../types';

type Step = 'select' | 'customize' | 'details' | 'success';

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CustomerFlow() {
  const [step, setStep] = useState<Step>('select');
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Selection state
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [isCustom, setIsCustom] = useState(false);

  // Custom cake state
  const [flavor, setFlavor] = useState('');
  const [toppings, setToppings] = useState<string[]>([]);
  const [sizeKg, setSizeKg] = useState<number>(1);
  const [message, setMessage] = useState('');

  // Order details
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupDate, setPickupDate] = useState(tomorrowISO());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([api.getCakes(), api.getOptions()])
      .then(([cakesRes, optionsRes]) => {
        setCakes(cakesRes);
        setOptions(optionsRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canGoToDetails = useMemo(() => {
    if (isCustom) return flavor.length > 0;
    return selectedCake !== null;
  }, [isCustom, flavor, selectedCake]);

  function pickPremade(cake: Cake) {
    setIsCustom(false);
    setSelectedCake(cake);
  }

  function pickCustom() {
    setIsCustom(true);
    setSelectedCake(null);
    setStep('customize');
  }

  function toggleTopping(t: string) {
    setToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
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
        isCustom,
        cakeId: selectedCake?.id,
        flavor: isCustom ? flavor : undefined,
        toppings: isCustom ? toppings : undefined,
        sizeKg: isCustom ? sizeKg : undefined,
        message: isCustom ? message : undefined,
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
    setIsCustom(false);
    setFlavor('');
    setToppings([]);
    setSizeKg(1);
    setMessage('');
    setCustomerName('');
    setPhone('');
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
          <p className="subtitle">Готова торта от каталога или направете своя, по ваш вкус.</p>
          <div className="cake-grid">
            {cakes.map((cake) => (
              <CakeCard
                key={cake.id}
                cake={cake}
                selected={!isCustom && selectedCake?.id === cake.id}
                onSelect={() => pickPremade(cake)}
              />
            ))}
            <button className="cake-card custom-card" onClick={pickCustom}>
              <div className="cake-emoji">🎨</div>
              <div className="cake-name">Направи си торта</div>
              <div className="cake-desc">Избери вкус, топинги и размер</div>
            </button>
          </div>
          <div className="actions">
            <button className="primary" disabled={!canGoToDetails} onClick={goToDetailsFromSelect}>
              Продължи
            </button>
          </div>
        </>
      )}

      {step === 'customize' && options && (
        <>
          <h1>Направи си торта</h1>

          <label className="field-label">Вкус</label>
          <div className="chip-row">
            {options.flavors.map((f) => (
              <button
                key={f}
                className={`chip ${flavor === f ? 'chip-selected' : ''}`}
                onClick={() => setFlavor(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <label className="field-label">Топинги (по избор)</label>
          <div className="chip-row">
            {options.toppings.map((t) => (
              <button
                key={t}
                className={`chip ${toppings.includes(t) ? 'chip-selected' : ''}`}
                onClick={() => toggleTopping(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="field-label">Размер (кг)</label>
          <div className="chip-row">
            {options.sizes.map((s) => (
              <button
                key={s}
                className={`chip ${sizeKg === s ? 'chip-selected' : ''}`}
                onClick={() => setSizeKg(s)}
              >
                {s} кг
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="message">Надпис върху тортата (по избор)</label>
          <input
            id="message"
            type="text"
            placeholder="напр. Честит рожден ден, Мария!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="actions">
            <button className="secondary" onClick={() => setStep('select')}>Назад</button>
            <button className="primary" disabled={!canGoToDetails} onClick={() => setStep('details')}>
              Продължи
            </button>
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <h1>Данни за поръчката</h1>

          <div className="order-summary">
            {isCustom ? (
              <>
                <strong>Custom торта</strong> — {flavor}, {sizeKg} кг
                {toppings.length > 0 && <> · {toppings.join(', ')}</>}
                {message && <> · надпис: "{message}"</>}
              </>
            ) : (
              <>
                <strong>{selectedCake?.name}</strong> — {selectedCake?.price.toFixed(2)} лв.
              </>
            )}
          </div>

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
            <button className="secondary" onClick={() => setStep(isCustom ? 'customize' : 'select')}>
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
