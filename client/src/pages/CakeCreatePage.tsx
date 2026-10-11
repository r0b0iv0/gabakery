import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [step, setStep] = useState<Step>('create');


    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [emoji, setEmoji] = useState('🎂');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

    const [recipeName, setRecipeName] = useState('');
    const [recipeDescription, setRecipeDescription] = useState('');

    const [recipeIngredients, setRecipeIngredients] = useState<
        RecipeIngredient[]
    >([]);

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const [loadingCake, setLoadingCake] = useState(Boolean(id));
    const [cakeLoadFailed, setCakeLoadFailed] = useState(false);

    useEffect(() => {
        let active = true;
        setLoadingCake(Boolean(id));
        setCakeLoadFailed(false);
        setError('');

        if (!id) {
            setName('');
            setDescription('');
            setPrice('');
            setEmoji('🎂');
            setImageFile(null);
            setExistingImageUrl(null);
            setRecipeName('');
            setRecipeDescription('');
            setRecipeIngredients([]);
            setStep('create');
        }

        async function loadFormData() {
            try {
                const [ingredientList, cake] = await Promise.all([
                    api.getIngredients(),
                    id ? api.getManagementCake(Number(id)) : Promise.resolve(null),
                ]);

                if (!active) return;
                setIngredients(ingredientList);

                if (id && cake) {
                    setName(cake.name);
                    setDescription(cake.description);
                    setPrice(String(cake.price));
                    setEmoji(cake.emoji);
                    setExistingImageUrl(cake.imageUrl);
                    setRecipeName(cake.recipe?.name ?? '');
                    setRecipeDescription(cake.recipe?.description ?? '');
                    setRecipeIngredients((cake.recipe?.ingredients ?? []).map((item) => ({
                        ingredientId: item.ingredientId,
                        quantity: String(item.quantity),
                    })));
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Неуспешно зареждане на тортата.');
                    setCakeLoadFailed(Boolean(id));
                }
            } finally {
                if (active) setLoadingCake(false);
            }
        }

        void loadFormData();
        return () => { active = false; };
    }, [id]);

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

        if (!name.trim() || !description.trim() || !price || !recipeName.trim()) {
            setError('Попълнете всички задължителни полета.');
            return;
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            setError('Въведете валидна цена.');
            return;
        }

        if (recipeIngredients.length === 0) {
            setError('Добавете поне една съставка.');
            return;
        }

        if (recipeIngredients.some((item) => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
            setError('Въведете количество, по-голямо от 0, за всяка съставка.');
            return;
        }

        if (new Set(recipeIngredients.map((item) => item.ingredientId)).size !== recipeIngredients.length) {
            setError('Всяка съставка може да бъде добавена само веднъж.');
            return;
        }

        try {
            setSaving(true);

            const payload = {
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
            };

            if (isEditing && id) {
                await api.updateCake(Number(id), payload, imageFile);
            } else {
                await api.createCake(payload, imageFile);
            }

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
        setExistingImageUrl(null);
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
                    <h1>{isEditing ? 'Редактиране на торта' : 'Създаване на торта'}</h1>
                    <p className="subtitle">
                        {isEditing ? 'Променете данните, снимката или рецептата на тортата.' : 'Добавете нова торта и нейната рецепта.'}
                    </p>

                    {error && <div className="error-banner">{error}</div>}

                    {loadingCake && <p>Зареждане на тортата...</p>}

                    {cakeLoadFailed && (
                        <button type="button" className="secondary" onClick={() => navigate('/order')}>
                            Към тортите
                        </button>
                    )}

                    {!loadingCake && !cakeLoadFailed && <form onSubmit={handleSubmit}>
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

                        <label className="field-label">Цена (€)</label>
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
                            {isEditing ? 'Нова снимка (по желание)' : 'Снимка на тортата (по желание)'}
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
                        {(imagePreviewUrl || existingImageUrl) && (
                            <img
                                className="cake-image-preview"
                                src={imagePreviewUrl || existingImageUrl || undefined}
                                alt={imagePreviewUrl ? 'Преглед на новата снимка' : 'Текуща снимка на тортата'}
                            />
                        )}
                        {imageFile && existingImageUrl && (
                            <button type="button" className="secondary" onClick={() => setImageFile(null)}>
                                Запази текущата снимка
                            </button>
                        )}

                        <h2>Рецепта</h2>
                        <p className="subtitle">Количествата на съставките са за торта от 8 парчета. За друг размер системата ги преизчислява пропорционално.</p>

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
                                {saving ? 'Запазване...' : isEditing ? 'Запази промените' : 'Създай торта'}
                            </button>

                            <button
                                type="button"
                                className="secondary"
                                onClick={() => navigate(isEditing && id ? `/cakes/${id}` : '/baker')}
                            >
                                Отказ
                            </button>
                        </div>
                    </form>}
                </>
            )}

            {step === 'success' && (
                <div className="success">
                    <div className="success-emoji">✅</div>
                    <h1>{isEditing ? 'Промените са запазени!' : 'Успешно създадена торта!'}</h1>
                    <p>{isEditing ? 'Тортата и рецептата са обновени.' : <>Можеш да откриеш своята торта на страницата <strong>Поръчай торта</strong>.</>}</p>
                    {isEditing ? (
                        <button className="primary" onClick={() => navigate('/order')}>Към тортите</button>
                    ) : (
                        <button className="primary" onClick={startOver}>Нова торта</button>
                    )}
                </div>
            )}
        </div>

    );
}
