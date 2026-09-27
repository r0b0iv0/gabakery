import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Ingredient } from '../types';

type RecipeIngredient = {
    ingredientId: number;
    quantity: string;
};

export function CakeCreatePage() {
    const navigate = useNavigate();

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [emoji, setEmoji] = useState('🎂');

    const [recipeName, setRecipeName] = useState('');
    const [recipeDescription, setRecipeDescription] = useState('');

    const [recipeIngredients, setRecipeIngredients] = useState<
        RecipeIngredient[]
    >([]);

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.getIngredients()
            .then(setIngredients)
            .catch((err) => setError(err.message));
    }, []);

    function addIngredient() {
        if (ingredients.length === 0) return;

        setRecipeIngredients((current) => [
            ...current,
            {
                ingredientId: ingredients[0].id,
                quantity: '',
            },
        ]);
    }

    function updateIngredient(
        index: number,
        field: keyof RecipeIngredient,
        value: string
    ) {
        setRecipeIngredients((current) =>
            current.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        [field]:
                            field === 'ingredientId' ? Number(value) : value,
                    }
                    : item
            )
        );
    }

    function removeIngredient(index: number) {
        setRecipeIngredients((current) =>
            current.filter((_, i) => i !== index)
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!name || !description || !price || !recipeName) {
            setError('Попълнете всички задължителни полета.');
            return;
        }

        if (recipeIngredients.length === 0) {
            setError('Добавете поне една съставка.');
            return;
        }

        try {
            setSaving(true);

            await api.createCake({
                name,
                description,
                price: Number(price),
                emoji,
                recipe: {
                    name: recipeName,
                    description: recipeDescription || undefined,
                    ingredients: recipeIngredients.map((item) => ({
                        ingredientId: item.ingredientId,
                        quantity: Number(item.quantity),
                    })),
                },
            });

            navigate('/baker');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Възникна грешка.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="page">
            <h1>Създаване на торта</h1>
            <p className="subtitle">
                Добавете нова торта и нейната рецепта.
            </p>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
                <label className="field-label">Име на тортата</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Шоколадова торта"
                />

                <label className="field-label">Описание</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание на тортата"
                />

                <label className="field-label">Цена</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />

                <label className="field-label">Емоджи</label>
                <input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    maxLength={4}
                />

                <h2>Рецепта</h2>

                <label className="field-label">Име на рецептата</label>
                <input
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Напр. Шоколадова торта"
                />

                <label className="field-label">Описание на рецептата</label>
                <textarea
                    value={recipeDescription}
                    onChange={(e) => setRecipeDescription(e.target.value)}
                />

                <label className="field-label">Съставки</label>

                {recipeIngredients.map((item, index) => {
                    const ingredient = ingredients.find(
                        (i) => i.id === item.ingredientId
                    );

                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                gap: 8,
                                marginBottom: 8,
                                alignItems: 'center',
                            }}
                        >
                            <select
                                value={item.ingredientId}
                                onChange={(e) =>
                                    updateIngredient(
                                        index,
                                        'ingredientId',
                                        e.target.value
                                    )
                                }
                            >
                                {ingredients.map((ingredient) => (
                                    <option key={ingredient.id} value={ingredient.id}>
                                        {ingredient.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={`Количество (${ingredient?.unit ?? ''})`}
                                value={item.quantity}
                                onChange={(e) =>
                                    updateIngredient(
                                        index,
                                        'quantity',
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                type="button"
                                className="secondary"
                                onClick={() => removeIngredient(index)}
                            >
                                Премахни
                            </button>
                        </div>
                    );
                })}

                <button
                    type="button"
                    className="secondary"
                    onClick={addIngredient}
                >
                    + Добави съставка
                </button>

                <div className="actions">
                    <button
                        type="submit"
                        className="primary"
                        disabled={saving}
                    >
                        {saving ? 'Запазване...' : 'Създай торта'}
                    </button>

                    <button
                        type="button"
                        className="secondary"
                        onClick={() => navigate('/baker')}
                    >
                        Отказ
                    </button>
                </div>
            </form>
        </div>
    );
}
