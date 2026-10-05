import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Order } from '../types';
import './BakerView.css';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABELS: Partial<Record<Order['status'], string>> = {
  confirmed: 'Потвърдена',
  in_progress: 'В процес',
  ready: 'Готова',
  picked_up: 'Взета',
};

const BAKER_STATUSES: Order['status'][] = [
  'confirmed',
  'in_progress',
  'ready',
  'picked_up',
];

export function BakerView() {
  const [date, setDate] = useState(todayISO());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getOrdersByDate(date)
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  async function changeStatus(order: Order, status: Order['status']) {
    setError(null);

    try {
      const updated = await api.updateOrderStatus(order.id, status);
      setOrders((prev) =>
        prev
          .map((current) => (current.id === updated.id ? updated : current))
          .filter((current) => current.status !== 'picked_up'),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неуспешна промяна на статуса.');
    }
  }

  async function changeCompletedQuantity(
    order: Order,
    itemId: number,
    completedQuantity: number,
  ) {
    setError(null);

    try {
      const updated = await api.updateOrderItemCompletedQuantity(
        order.id,
        itemId,
        completedQuantity,
      );
      setOrders((prev) =>
        prev.map((current) => (current.id === updated.id ? updated : current)),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Неуспешна промяна на завършеното количество.',
      );
    }
  }

  return (
    <div className="page">
      <h1>Поръчки за деня</h1>
      <p className="subtitle">
        Потвърдени поръчки за избраната дата.
      </p>

      <label className="field-label" htmlFor="bakerDate">
        Дата
      </label>
      <input
        id="bakerDate"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />

      {error && <div className="error-banner">{error}</div>}
      {loading && <p>Зареждане...</p>}

      {!loading && orders.length === 0 && (
        <p className="empty-state">Няма поръчки за тази дата.</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className={`order-card status-${order.status}`}>
              <div className="order-card-header">
                <span>Поръчка #{order.id}</span>

                <select
                  value={order.status}
                  onChange={(event) =>
                    changeStatus(order, event.target.value as Order['status'])
                  }
                  aria-label={`Статус на поръчка ${order.id}`}
                >
                  {BAKER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="order-cakes">
                {order.items.map((item) => (
                  <div className="order-cake" key={item.id}>
                    <div className="order-cake-details">
                      <strong>
                        {item.cake.emoji} {item.cake.name}
                      </strong>
                      <span>
                        Завършени: {item.completedQuantity} / {item.quantity}
                      </span>
                    </div>

                    <div className="cake-progress-controls">
                      <button
                        type="button"
                        className="progress-button"
                        aria-label={`Намали завършените ${item.cake.name}`}
                        onClick={() =>
                          changeCompletedQuantity(
                            order,
                            item.id,
                            Math.max(0, item.completedQuantity - 1),
                          )
                        }
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="progress-button"
                        aria-label={`Увеличи завършените ${item.cake.name}`}
                        onClick={() =>
                          changeCompletedQuantity(
                            order,
                            item.id,
                            Math.min(item.quantity, item.completedQuantity + 1),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="order-notes">Бележка: {order.notes}</div>
              )}

              <div className="order-customer">
                {order.customerName} · {order.phone}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
