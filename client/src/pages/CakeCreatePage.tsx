import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Ingredient } from '../types';
import './CakeCreatePage.css';

type Step = 'create' | 'success';


type RecipeIngredient = {
    ingredientId: number;
    quantity: string;
};

export function CakeCreatePage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('create');


    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [emoji, setEmoji] = useState('🎂');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');

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

    useEffect(() => {
        if (!imageFile) {
            setImagePreviewUrl('');
            return;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreviewUrl(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

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
            }, imageFile);

            setStep("success")
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Възникна грешка.');
        } finally {
            setSaving(false);
        }
    }

    function startOver() {
        setStep("create");
        setIngredients([]);
        setName('');
        setDescription('');
        setEmoji('🎂');
        setImageFile(null);
        setPrice('');
        setRecipeName('');
        setRecipeDescription('');
        setRecipeIngredients([])
        setError('')
    }

    return (
        <div className="page">

            {step === "create" && (
                <>
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

                        <label className="field-label" htmlFor="cakeImage">
                            Снимка на тортата (по желание)
                        </label>
                        <input
                            id="cakeImage"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;

                                if (!file) {
                                    setImageFile(null);
                                    return;
                                }

                                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                                    setError('Изберете JPG, PNG или WebP снимка.');
                                    setImageFile(null);
                                    event.target.value = '';
                                    return;
                                }

                                if (file.size > 5 * 1024 * 1024) {
                                    setError('Снимката трябва да е до 5 MB.');
                                    setImageFile(null);
                                    event.target.value = '';
                                    return;
                                }

                                setError('');
                                setImageFile(file);
                            }}
                        />
                        {imagePreviewUrl && (
                            <img
                                className="cake-image-preview"
                                src={imagePreviewUrl}
                                alt="Преглед на снимката на тортата"
                            />
                        )}

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
                </>
            )}

            {step === 'success' && (
                <div className="success">
                    <div className="success-emoji">✅</div>
                    <h1>Успешно създадена торта!</h1>
                    <p>
                        Можеш да откриеш своята торта на страницата <strong> Поръчай торта</strong>
                    </p>
                    <button className="primary" onClick={startOver}>Нова торта</button>
                </div>
            )}
        </div>

    );
}
