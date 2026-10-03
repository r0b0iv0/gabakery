import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Order, OrderAvailability } from '../types';
import './OrderManagementPage.css';

export function OrderManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [availability, setAvailability] = useState<
        Record<number, OrderAvailability>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checking, setChecking] = useState<number | null>(null);
    const [confirming, setConfirming] = useState<number | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            setError('');
            const data = await api.getManagementOrders();
            setOrders(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при зареждане на поръчките.'
            );
        } finally {
            setLoading(false);
        }
    }

    async function checkAvailability(orderId: number) {
        try {
            setChecking(orderId);
            setError('');

            const result = await api.getOrderAvailability(orderId);

            setAvailability(current => ({
                ...current,
                [orderId]: result,
            }));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при проверка на наличността.'
            );
        } finally {
            setChecking(null);
        }
    }

    async function confirmOrder(orderId: number) {
        try {
            setConfirming(orderId);
            setError('');

            await api.confirmOrder(orderId);

            setOrders(current =>
                current.filter(order => order.id !== orderId)
            );

            setAvailability(current => {
                const next = { ...current };
                delete next[orderId];
                return next;
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при потвърждаване на поръчката.'
            );
        } finally {
            setConfirming(null);
        }
    }

    function getOrderGroup(order: Order) {
        if (order.daysUntilPickup === 0) {
            return 'Днес';
        }

        if (order.daysUntilPickup === 1) {
            return 'Утре';
        }

        if (
            order.daysUntilPickup !== undefined &&
            order.daysUntilPickup <= 2
        ) {
            return 'Следващите дни';
        }

        return 'Бъдещи поръчки';
    }

    const groups = [
        'Днес',
        'Утре',
        'Следващите дни',
        'Бъдещи поръчки',
    ];

    if (loading) {
        return (
            <div className="page">
                <p>Зареждане...</p>
            </div>
        );
    }

    return (
        <div className="page order-management-page">
            <h1>Управление на поръчки</h1>

            <p className="subtitle">
                Проверявайте какви ресурси ще използва всяка поръчка.
            </p>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {orders.length === 0 && (
                <div className="empty-orders">
                    Няма чакащи поръчки.
                </div>
            )}

            {groups.map(group => {
                const groupOrders = orders.filter(
                    order => getOrderGroup(order) === group
                );

                if (groupOrders.length === 0) {
                    return null;
                }

                return (
                    <section className="order-group" key={group}>
                        <h2>{group}</h2>

                        <div className="management-orders">
                            {groupOrders.map(order => {
                                const orderAvailability =
                                    availability[order.id];

                                const isChecking =
                                    checking === order.id;

                                const isConfirming =
                                    confirming === order.id;

                                return (
                                    <div
                                        className="management-order"
                                        key={order.id}
                                    >
                                        <div className="management-order-header">
                                            <div>
                                                <h3>Поръчка #{order.id}</h3>

                                                <p>
                                                    {order.customerName} · {order.phone}
                                                </p>
                                            </div>

                                            <span className="pickup-date">
                                                {new Date(
                                                    order.pickupDate
                                                ).toLocaleDateString('bg-BG')}
                                            </span>
                                        </div>

                                        <div className="management-order-items">
                                            {order.items.map(item => (
                                                <div
                                                    className="management-order-item"
                                                    key={item.id}
                                                >
                                                    <span>
                                                        {item.cake.emoji}{' '}
                                                        {item.cake.name}
                                                    </span>

                                                    <strong>
                                                        × {item.quantity}
                                                    </strong>
                                                </div>
                                            ))}
                                        </div>

                                        {order.notes && (
                                            <div className="management-notes">
                                                <strong>Бележки:</strong>{' '}
                                                {order.notes}
                                            </div>
                                        )}

                                        {orderAvailability && (
                                            <div className="availability">
                                                <h4>Необходими ресурси</h4>

                                                <div className="availability-header">
                                                    <span>Съставка</span>
                                                    <span>Нужни</span>
                                                    <span>Налични</span>
                                                    <span>Остават</span>
                                                </div>

                                                {orderAvailability.ingredients.map(ingredient => {
                                                    const remaining =
                                                        ingredient.available - ingredient.required;

                                                    return (
                                                        <div
                                                            className="availability-row"
                                                            key={ingredient.ingredientId}
                                                        >
                                                            <span className="ingredient-name">
                                                                {ingredient.name}
                                                            </span>

                                                            <span className="ingredient-needed">
                                                                {ingredient.required} {ingredient.unit}
                                                            </span>

                                                            <span
                                                                className={
                                                                    ingredient.sufficient
                                                                        ? 'ingredient-available'
                                                                        : 'ingredient-insufficient'
                                                                }
                                                            >
                                                                {ingredient.available} {ingredient.unit}
                                                            </span>

                                                            <span
                                                                className={
                                                                    remaining >= 0
                                                                        ? 'ingredient-remaining'
                                                                        : 'ingredient-insufficient'
                                                                }
                                                            >
                                                                {remaining} {ingredient.unit}
                                                            </span>
                                                        </div>
                                                    );
                                                })}

                                                <div
                                                    className={
                                                        orderAvailability.available
                                                            ? 'availability-result available'
                                                            : 'availability-result unavailable'
                                                    }
                                                >
                                                    {orderAvailability.available
                                                        ? 'Всички необходими съставки са налични.'
                                                        : 'Няма достатъчно количество от една или повече съставки.'}
                                                </div>
                                            </div>
                                        )}

                                        <div className="management-order-actions">
                                            <button
                                                type="button"
                                                className="secondary"
                                                disabled={
                                                    isChecking ||
                                                    isConfirming
                                                }
                                                onClick={() =>
                                                    checkAvailability(order.id)
                                                }
                                            >
                                                {isChecking
                                                    ? 'Проверка...'
                                                    : orderAvailability
                                                        ? 'Обнови наличност'
                                                        : 'Провери наличност'}
                                            </button>

                                            {orderAvailability?.available && (
                                                <button
                                                    type="button"
                                                    className="primary"
                                                    disabled={isConfirming}
                                                    onClick={() =>
                                                        confirmOrder(order.id)
                                                    }
                                                >
                                                    {isConfirming
                                                        ? 'Потвърждаване...'
                                                        : 'Потвърди поръчката'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}