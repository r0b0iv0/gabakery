import { Link } from 'react-router-dom';
import { CakeCard } from '../components/CakeCard';
import { useEffect, useState } from 'react';
import { Cake } from '../types';
import { api } from '../api';
import "./MainPage.css";

const GALLERY = [
  { emoji: '🎂', caption: 'Ръчно приготвени торти' },
  { emoji: '🎨', caption: 'Персонализиран дизайн по ваша идея' },
  { emoji: '🍓', caption: 'Пресни и качествени съставки' },
  { emoji: '📦', caption: 'Внимателно опаковане за вземане' },
];

export function MainPage() {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCakes()
      .then((cakesRes) => {
        setCakes(cakesRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <h1 className="hero-title">Създаваме с желание</h1>
        <p className="hero-text">
          GaBakery е малка пекарна, в която всяка торта се прави ръчно — с внимание към
          детайла и вкус, който помните. Изберете готова торта от каталога или ни кажете
          какво си представяте и ще я направим за вас.
        </p>
        <button className='secondary'>

          <Link to="/order" className="primary hero-cta ">
            Поръчай торта
          </Link>
        </button>
      </section>

      <section className="about">
        <h2>Топ предложения</h2>
        <p className="subtitle">
          Изберете от нашите любими предложения
        </p>
        <div className="cake-grid">
          {cakes.map((cake) => (
            <CakeCard
              key={cake.id}
              cake={cake}
              selected={false}
              onSelect={() => { }}
            />
          ))}
        </div>
      </section>

      <section className="about">
        <h2>За нас</h2>
        <p className="subtitle">
          Работим всеки ден, за да направим вашия празник по-сладък. Ето малка част от това,
          с което се занимаваме.
        </p>
        <div className="photo-grid">
          {GALLERY.map((item) => (
            <div className="photo-card" key={item.caption}>
              {/* Replace this div with <img src="/images/..." /> once real photos are ready */}
              <div className="photo-placeholder">{item.emoji}</div>
              <div className="photo-caption">{item.caption}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
