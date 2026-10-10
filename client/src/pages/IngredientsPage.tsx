import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Ingredient } from '../types';
import './IngredientsPage.css';

export function IngredientsPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showLowStock, setShowLowStock] = useState(false);
    const [showAddIngredient, setShowAddIngredient] = useState(false);
    const [showStockAdjustment, setShowStockAdjustment] = useState(false);

    const [selectedIngredient, setSelectedIngredient] =
        useState<Ingredient | null>(null);

    const [stockAmount, setStockAmount] = useState('');
    const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');

    const [name, setName] = useState('');
    const [unit, setUnit] = useState('kg');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('');

    useEffect(() => {
        loadIngredients();
    }, []);

    async function loadIngredients() {
        try {
            setError('');
            const data = await api.getIngredients();
            setIngredients(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при зареждане.'
            );
        } finally {
            setLoading(false);
        }
    }

    function resetIngredientForm() {
        setName('');
        setUnit('kg');
        setDescription('');
        setQuantity('');
        setLowStockThreshold('');
    }

    async function handleCreateIngredient() {
        if (!name || quantity === '' || lowStockThreshold === '') {
            setError('Попълнете всички задължителни полета.');
            return;
        }

        try {
            setError('');

            await api.createIngredient({
                name,
                unit,
                description: description || undefined,
                quantity: Number(quantity),
                lowStockThreshold: Number(lowStockThreshold),
            });

            resetIngredientForm();
            setShowAddIngredient(false);
            await loadIngredients();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при създаване.'
            );
        }
    }

    async function handleStockAdjustment() {
        const amount = Number(stockAmount);

        if (
            !selectedIngredient ||
            stockAmount === '' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setError('Въведете количество, по-голямо от 0.');
            return;
        }

        const currentQuantity = selectedIngredient.inventory?.quantity ?? 0;

        if (stockAction === 'remove' && amount > currentQuantity) {
            setError('Количеството за премахване надвишава наличността.');
            return;
        }

        try {
            setError('');

            await api.adjustIngredientStock(
                selectedIngredient.id,
                amount,
                stockAction,
            );

            setStockAmount('');
            setSelectedIngredient(null);
            setShowStockAdjustment(false);
            setStockAction('add');

            await loadIngredients();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Грешка при обновяване.'
            );
        }
    }

    const lowStockCount = ingredients.filter(ingredient => {
        const quantity = ingredient.inventory?.quantity ?? 0;
        const threshold =
            ingredient.inventory?.lowStockThreshold ?? 0;

        return quantity <= threshold;
    }).length;

    const displayedIngredients = showLowStock
        ? ingredients.filter(ingredient => {
            const quantity = ingredient.inventory?.quantity ?? 0;
            const threshold =
                ingredient.inventory?.lowStockThreshold ?? 0;

            return quantity <= threshold;
        })
        : ingredients;

    if (loading) {
        return (
            <div className="page ingredients-page">
                <p>Зареждане...</p>
            </div>
        );
    }

    return (
        <div className="page ingredients-page">
            <div className="ingredients-header">
                <div>
                    <h1>Съставки</h1>
                    <p className="subtitle">
                        Управление на наличностите
                    </p>
                </div>

                <button
                    type="button"
                    className="primary"
                    onClick={() => {
                        setError('');
                        setShowAddIngredient(true);
                    }}
                >
                    + Нова съставка
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <div className="ingredients-summary">
                <div className="summary-card">
                    <span className="summary-label">
                        Всички съставки
                    </span>
                    <strong>{ingredients.length}</strong>
                </div>

                <div className="summary-card low-stock-summary">
                    <span className="summary-label">
                        Ниска наличност
                    </span>
                    <strong>{lowStockCount}</strong>
                </div>
            </div>

            <div className="ingredients-filters">
                <button
                    type="button"
                    className={!showLowStock ? 'filter-active' : ''}
                    onClick={() => setShowLowStock(false)}
                >
                    Всички
                </button>

                <button
                    type="button"
                    className={showLowStock ? 'filter-active' : ''}
                    onClick={() => setShowLowStock(true)}
                >
                    🔴 Ниска наличност
                </button>
            </div>

            {displayedIngredients.length === 0 ? (
                <div className="ingredients-empty">
                    <span>📦</span>
                    <p>
                        {showLowStock
                            ? 'Няма съставки с ниска наличност.'
                            : 'Все още няма добавени съставки.'}
                    </p>
                </div>
            ) : (
                <div className="ingredients-table-wrapper">
                    <table className="ingredients-table">
                        <thead>
                            <tr>
                                <th>Съставка</th>
                                <th>Наличност</th>
                                <th>Минимум</th>
                                <th>Статус</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {displayedIngredients.map(ingredient => {
                                const quantity =
                                    ingredient.inventory?.quantity ?? 0;

                                const threshold =
                                    ingredient.inventory
                                        ?.lowStockThreshold ?? 0;

                                const isLowStock =
                                    quantity <= threshold;

                                return (
                                    <tr key={ingredient.id}>
                                        <td>
                                            <div className="ingredient-name">
                                                {ingredient.name}
                                            </div>

                                            {ingredient.description && (
                                                <div className="ingredient-description">
                                                    {ingredient.description}
                                                </div>
                                            )}
                                        </td>

                                        <td>
                                            <strong>{quantity}</strong>{' '}
                                            {ingredient.unit}
                                        </td>

                                        <td>
                                            {threshold}{' '}
                                            {ingredient.unit}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    isLowStock
                                                        ? 'stock-status stock-low'
                                                        : 'stock-status stock-good'
                                                }
                                            >
                                                {isLowStock
                                                    ? '🔴 Ниска'
                                                    : '🟢 Добра'}
                                            </span>
                                        </td>

                                        <td className="ingredient-actions">
                                            <button
                                                type="button"
                                                className="secondary"
                                                onClick={() => {
                                                    setError('');
                                                    setStockAmount('');
                                                    setStockAction('add');
                                                    setSelectedIngredient(
                                                        ingredient
                                                    );
                                                    setShowStockAdjustment(true);
                                                }}
                                            >
                                                Промени наличност
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddIngredient && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Нова съставка</h2>

                        <label className="field-label">
                            Име
                        </label>

                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Например: Брашно"
                        />

                        <label className="field-label">
                            Мерна единица
                        </label>

                        <select
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                        >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                            <option value="pcs">pcs</option>
                        </select>

                        <label className="field-label">
                            Описание
                        </label>

                        <input
                            value={description}
                            onChange={e =>
                                setDescription(e.target.value)
                            }
                            placeholder="По желание"
                        />

                        <label className="field-label">
                            Начална наличност
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={e =>
                                setQuantity(e.target.value)
                            }
                        />

                        <label className="field-label">
                            Минимална наличност
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={lowStockThreshold}
                            onChange={e =>
                                setLowStockThreshold(e.target.value)
                            }
                        />

                        <div className="actions">
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    resetIngredientForm();
                                    setShowAddIngredient(false);
                                }}
                            >
                                Отказ
                            </button>

                            <button
                                type="button"
                                className="primary"
                                onClick={handleCreateIngredient}
                            >
                                Създай
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStockAdjustment && selectedIngredient && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Промени наличност</h2>

                        <div className="stock-adjustment-toggle" role="group" aria-label="Операция с наличността">
                            <button
                                type="button"
                                className={stockAction === 'add' ? 'selected' : ''}
                                aria-pressed={stockAction === 'add'}
                                onClick={() => {
                                    setStockAction('add');
                                    setError('');
                                }}
                            >
                                Добави
                            </button>
                            <button
                                type="button"
                                className={stockAction === 'remove' ? 'selected' : ''}
                                aria-pressed={stockAction === 'remove'}
                                onClick={() => {
                                    setStockAction('remove');
                                    setError('');
                                }}
                            >
                                Премахни
                            </button>
                        </div>

                        <div className="stock-modal-info">
                            <strong>
                                {selectedIngredient.name}
                            </strong>

                            <span>
                                Текущо:{' '}
                                {selectedIngredient.inventory
                                    ?.quantity ?? 0}{' '}
                                {selectedIngredient.unit}
                            </span>
                        </div>

                        <label className="field-label">
                            {stockAction === 'add'
                                ? 'Количество за добавяне'
                                : 'Количество за премахване'}
                        </label>

                        <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={stockAmount}
                            onChange={e =>
                                setStockAmount(e.target.value)
                            }
                            placeholder={selectedIngredient.unit}
                        />

                        {stockAmount !== '' && Number.isFinite(Number(stockAmount)) && Number(stockAmount) > 0 && (
                            <div className="stock-adjustment-preview">
                                <span>Нова наличност:</span>
                                <strong>
                                    {stockAction === 'add'
                                        ? (selectedIngredient.inventory?.quantity ?? 0) + Number(stockAmount)
                                        : (selectedIngredient.inventory?.quantity ?? 0) - Number(stockAmount)}{' '}
                                    {selectedIngredient.unit}
                                </strong>
                            </div>
                        )}

                        {stockAction === 'remove' &&
                            stockAmount !== '' &&
                            Number(stockAmount) > (selectedIngredient.inventory?.quantity ?? 0) && (
                                <p className="stock-adjustment-error">
                                    Количеството за премахване надвишава наличността.
                                </p>
                            )}

                        <div className="actions">
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    setStockAmount('');
                                    setSelectedIngredient(null);
                                    setShowStockAdjustment(false);
                                    setStockAction('add');
                                }}
                            >
                                Отказ
                            </button>

                            <button
                                type="button"
                                className="primary"
                                onClick={handleStockAdjustment}
                                disabled={
                                    stockAmount === '' ||
                                    !Number.isFinite(Number(stockAmount)) ||
                                    Number(stockAmount) <= 0 ||
                                    (stockAction === 'remove' &&
                                        Number(stockAmount) > (selectedIngredient.inventory?.quantity ?? 0))
                                }
                            >
                                {stockAction === 'add' ? 'Добави' : 'Премахни'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
