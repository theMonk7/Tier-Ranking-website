import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { TierItem } from '../types/tier';
import { TierItemCard } from './TierItemCard';

interface Props {
  items: TierItem[];
  onRemove: (id: string) => void;
}

export function UnrankedPool({ items, onRemove }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });

  return (
    <div className={`unranked-pool ${isOver ? 'pool-over' : ''}`}>
      <div className="pool-header">
        <span>⚡ UNRANKED POOL</span>
        <span className="pool-count">{items.length} items</span>
      </div>
      <div ref={setNodeRef} className="pool-content">
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((item) => (
            <TierItemCard key={item.id} item={item} onRemove={onRemove} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="pool-empty">Upload images or drag items here</div>
        )}
      </div>
    </div>
  );
}
