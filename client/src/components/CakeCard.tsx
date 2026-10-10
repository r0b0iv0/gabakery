import type { Cake } from '../types';
import { Link } from 'react-router-dom';

interface Props {
  cake: Cake;
  selected: boolean;
  onSelect: () => void;
}

export function CakeCard({ cake, selected, onSelect }: Props) {
  return (
    <article className={`cake-card ${selected ? 'selected' : ''}`}>
      <Link className="cake-card-link" to={`/cakes/${cake.id}`}>
        {cake.imageUrl ? (
          <img className="cake-card-image" src={cake.imageUrl} alt={cake.name} />
        ) : (
          <div className="cake-card-image cake-card-image-fallback" aria-hidden="true">
            {cake.emoji}
          </div>
        )}
        <div className="cake-name">{cake.name}</div>
        <div className="cake-desc">{cake.description}</div>
        <div className="cake-price">{cake.price.toFixed(2)} лв.</div>
      </Link>
      <button type="button" className="cake-card-order" onClick={onSelect}>
        Поръчай
      </button>
    </article>
  );
}
