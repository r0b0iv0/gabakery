import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Order } from '../types';
import "./BakerView.css"

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Чакаща',
  in_progress: 'В процес',
  ready: 'Готова',
  picked_up: 'Взета',
};

export function BakerView() {
  const [date, setDate] = useState(todayISO());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load(d: string) {
    setLoading(true);
    api
      .getOrdersByDate(d)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function changeStatus(order: Order, status: Order['status']) {
    try {
      const updated = await api.updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="page">
      <h1>Поръчки за деня</h1>
      <p className="subtitle">Всички торти, които трябва да са готови на избраната дата.</p>

      <label className="field-label" htmlFor="bakerDate">Дата</label>
      <input id="bakerDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      {error && <div className="error-banner">{error}</div>}
      {loading && <p>Зареждане...</p>}

      {!loading && orders.length === 0 && <p className="empty-state">Няма поръчки за тази дата.</p>}

      <div className="order-list">
        {orders.map((order) => {
          const toppings: string[] = order.toppings ? JSON.parse(order.toppings) : [];
          return (
            <div key={order.id} className={`order-card status-${order.status}`}>
              <div className="order-card-header">
                <span>Поръчка #{order.id}</span>
                <select
                  value={order.status}
                  onChange={(e) => changeStatus(order, e.target.value as Order['status'])}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="order-cake">
                {order.isCustom ? (
                  <>
                    <strong>Custom: {order.flavor}</strong>, {order.sizeKg} кг
                    {toppings.length > 0 && <div>Топинги: {toppings.join(', ')}</div>}
                    {order.message && <div>Надпис: "{order.message}"</div>}
                  </>
                ) : (
                  <strong>
                    {order.cake?.emoji} {order.cake?.name}
                  </strong>
                )}
              </div>

              {order.notes && <div className="order-notes">Бележка: {order.notes}</div>}

              <div className="order-customer">
                {order.customerName} · {order.phone}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
