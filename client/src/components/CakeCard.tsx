import type { Cake } from '../types';

interface Props {
  cake: Cake;
  selected: boolean;
  onSelect: () => void;
}

export function CakeCard({ cake, selected, onSelect }: Props) {
  return (
    <button className={`cake-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="cake-emoji">{cake.emoji}</div>
      <div className="cake-name">{cake.name}</div>
      <div className="cake-desc">{cake.description}</div>
      <div className="cake-price">{cake.price.toFixed(2)} лв.</div>
    </button>
  );
}
