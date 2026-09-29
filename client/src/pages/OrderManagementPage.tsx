import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Order, OrderAvailability } from '../types';
import './OrderManagementPage.css';

export function OrderManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [availability, setAvailability] = useState<
        Record<number, OrderAvailability>
    >({});

    const [checkingOrder, setCheckingOrder] = useState<number | null>(null);
    const [confirmingOrder, setConfirmingOrder] = useState<number | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            setError('');

            const data = await api.getManagementOrders();

            setOrders(data);

            for (const order of data) {
                checkAvailability(order.id);
            }
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
            setCheckingOrder(orderId);

            const data = await api.getOrderAvailability(orderId);

            setAvailability(prev => ({
                ...prev,
                [orderId]: data,
            }));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при проверка на наличностите.'
            );
        } finally {
            setCheckingOrder(null);
        }
    }

    async function handleConfirm(orderId: number) {
        try {
            setError('');
            setConfirmingOrder(orderId);

            await api.confirmOrder(orderId);

            setOrders(prev =>
                prev.filter(order => order.id !== orderId)
            );

            setAvailability(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при потвърждаване на поръчката.'
            );

            await checkAvailability(orderId);
        } finally {
            setConfirmingOrder(null);
        }
    }

    function getOrderCategory(order: Order) {
        if (order.daysUntilPickup === 0) {
            return 'today';
        }

        if (order.daysUntilPickup === 1) {
            return 'tomorrow';
        }

        if (order.isNearPickup) {
            return 'soon';
        }

        return 'future';
    }

    function getCategoryTitle(category: string) {
        switch (category) {
            case 'today':
                return '🔴 Днес';

            case 'tomorrow':
                return '🟡 Утре';

            case 'soon':
                return '🟢 Следващи дни';

            default:
                return '📅 Бъдещи поръчки';
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    if (loading) {
        return (
            <div className="page order-management-page">
                <p>Зареждане...</p>
            </div>
        );
    }

    const categories = ['today', 'tomorrow', 'soon', 'future'];

    return (
        <div className="page order-management-page">
            <div className="management-header">
                <div>
                    <h1>Управление на поръчки</h1>
                    <p className="subtitle">
                        Проверка на наличности и потвърждаване на поръчки
                    </p>
                </div>

                <div className="orders-count">
                    <strong>{orders.length}</strong>
                    <span>чакащи поръчки</span>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <span>🎉</span>
                    <h2>Няма чакащи поръчки</h2>
                    <p>Всички поръчки са обработени.</p>
                </div>
            ) : (
                categories.map(category => {
                    const categoryOrders = orders.filter(
                        order => getOrderCategory(order) === category
                    );

                    if (categoryOrders.length === 0) {
                        return null;
                    }

                    return (
                        <section
                            key={category}
                            className={`order-section order-section-${category}`}
                        >
                            <h2>{getCategoryTitle(category)}</h2>

                            <div className="management-order-list">
                                {categoryOrders.map(order => {
                                    const orderAvailability =
                                        availability[order.id];

                                    const isChecking =
                                        checkingOrder === order.id;

                                    const isConfirming =
                                        confirmingOrder === order.id;

                                    const canConfirm =
                                        orderAvailability?.available === true;

                                    return (
                                        <div
                                            key={order.id}
                                            className="management-order-card"
                                        >
                                            <div className="order-card-header">
                                                <div>
                                                    <span className="order-number">
                                                        Поръчка #{order.id}
                                                    </span>

                                                    <h3>
                                                        {order.cake?.emoji}{' '}
                                                        {order.cake?.name}
                                                        {' × '}
                                                        {order.quantity}
                                                    </h3>
                                                </div>

                                                <div className="pickup-info">
                                                    <span>Вземане</span>
                                                    <strong>
                                                        {formatDate(order.pickupDate)}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="customer-info">
                                                <strong>
                                                    {order.customerName}
                                                </strong>

                                                <span>
                                                    {order.phone}
                                                </span>
                                            </div>

                                            {order.notes && (
                                                <div className="order-notes">
                                                    <strong>Бележка:</strong>{' '}
                                                    {order.notes}
                                                </div>
                                            )}

                                            <div className="ingredients-header">
                                                <h4>Необходими съставки</h4>

                                                {isChecking && (
                                                    <span className="checking">
                                                        Проверка...
                                                    </span>
                                                )}
                                            </div>

                                            {orderAvailability && (
                                                <div className="order-ingredients">
                                                    {orderAvailability.ingredients.map(
                                                        ingredient => (
                                                            <div
                                                                key={ingredient.ingredientId}
                                                                className={`ingredient-row ${ingredient.sufficient
                                                                        ? 'ingredient-sufficient'
                                                                        : 'ingredient-insufficient'
                                                                    }`}
                                                            >
                                                                <div>
                                                                    <strong>
                                                                        {ingredient.name}
                                                                    </strong>
                                                                </div>

                                                                <div className="ingredient-amount">
                                                                    <span>
                                                                        Нужно:{' '}
                                                                        {ingredient.required}{' '}
                                                                        {ingredient.unit}
                                                                    </span>

                                                                    <span>
                                                                        Налично:{' '}
                                                                        {ingredient.available}{' '}
                                                                        {ingredient.unit}
                                                                    </span>
                                                                </div>

                                                                <span className="ingredient-status">
                                                                    {ingredient.sufficient
                                                                        ? '🟢'
                                                                        : '🔴'}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            <div className="order-card-footer">
                                                {!orderAvailability && !isChecking && (
                                                    <button
                                                        type="button"
                                                        className="secondary"
                                                        onClick={() =>
                                                            checkAvailability(order.id)
                                                        }
                                                    >
                                                        Провери наличност
                                                    </button>
                                                )}

                                                {orderAvailability && (
                                                    <>
                                                        {canConfirm ? (
                                                            <button
                                                                type="button"
                                                                className="primary"
                                                                disabled={isConfirming}
                                                                onClick={() =>
                                                                    handleConfirm(order.id)
                                                                }
                                                            >
                                                                {isConfirming
                                                                    ? 'Потвърждаване...'
                                                                    : '✓ Потвърди поръчката'}
                                                            </button>
                                                        ) : (
                                                            <div className="insufficient-warning">
                                                                🔴 Недостатъчно количество
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })
            )}
        </div>
    );
}