import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Order } from '../types';
import './OrderHistoryPage.css';

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Чака потвърждение',
  confirmed: 'Потвърдена',
  in_progress: 'В процес',
  ready: 'Готова за вземане',
  picked_up: 'Взета',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyOrders()
      .then(setOrders)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page order-history-page">
      <h1>Моите поръчки</h1>
      <p className="subtitle">Проследявайте статуса и датата за вземане на вашите поръчки.</p>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p>Зареждане на поръчките...</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="order-history-empty">
          <p>Все още нямате поръчки, свързани с този профил.</p>
          <Link className="order-history-browse-link" to="/order">Разгледайте тортите</Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="order-history-list">
          {orders.map((order) => (
            <article className="order-history-card" key={order.id}>
              <header className="order-history-header">
                <div>
                  <h2>Поръчка #{order.id}</h2>
                  <p>Създадена на {formatDate(order.createdAt)}</p>
                </div>
                <span className={`order-history-status status-${order.status}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </header>

              <div className="order-history-pickup">
                <strong>Дата за вземане:</strong> {formatDate(order.pickupDate)}
              </div>

              <ul className="order-history-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.cake.emoji} {item.cake.name} · {item.pieces} парчета</span>
                    <strong>× {item.quantity}</strong>
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="order-history-notes"><strong>Бележки:</strong> {order.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
