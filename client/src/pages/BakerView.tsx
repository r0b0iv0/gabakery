import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Order, OrderItem } from '../types';
import './BakerView.css';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatQuantity(quantity: number): string {
  return String(Number(quantity.toFixed(2)));
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
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<OrderItem | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getOrdersByDate(date)
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    if (!selectedRecipeItem) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedRecipeItem(null);
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedRecipeItem]);

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
                      <button
                        type="button"
                        className="cake-name-button"
                        onClick={() => setSelectedRecipeItem(item)}
                      >
                        {item.cake.emoji} {item.cake.name}
                      </button>
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

      {selectedRecipeItem && (
        <div
          className="recipe-modal-backdrop"
          onClick={() => setSelectedRecipeItem(null)}
        >
          <section
            className="recipe-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="recipe-modal-header">
              <div>
                <h2 id="recipe-modal-title">
                  {selectedRecipeItem.cake.emoji} {selectedRecipeItem.cake.name}
                </h2>
                <p>Рецепта за поръчка #{selectedRecipeItem.orderId}</p>
              </div>
              <button
                type="button"
                className="recipe-modal-close"
                aria-label="Затвори рецептата"
                autoFocus
                onClick={() => setSelectedRecipeItem(null)}
              >
                ×
              </button>
            </div>

            {selectedRecipeItem.cake.recipe ? (
              <div className="recipe-modal-content">
                <h3>{selectedRecipeItem.cake.recipe.name}</h3>
                {selectedRecipeItem.cake.recipe.description && (
                  <p className="recipe-description">
                    {selectedRecipeItem.cake.recipe.description}
                  </p>
                )}

                <p className="recipe-batch-size">
                  Количество в поръчката: {selectedRecipeItem.quantity} бр.
                </p>

                <div className="recipe-ingredient-list">
                  {selectedRecipeItem.cake.recipe.ingredients.map((item) => (
                    <div className="recipe-ingredient-row" key={item.id}>
                      <span>{item.ingredient.name}</span>
                      <span>
                        {formatQuantity(item.quantity)} {item.ingredient.unit} / торта
                      </span>
                      <strong>
                        {formatQuantity(item.quantity * selectedRecipeItem.quantity)}{' '}
                        {item.ingredient.unit} общо
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="recipe-empty-state">
                Няма добавена рецепта за тази торта.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
