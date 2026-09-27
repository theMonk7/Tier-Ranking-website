import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TierItem as TierItemType } from '../types/tier';

interface Props {
  item: TierItemType;
  onRemove: (id: string) => void;
}

export function TierItemCard({ item, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="tier-item"
      {...attributes}
      {...listeners}
    >
      <img src={item.image} alt={item.name} draggable={false} />
      <button
        className="tier-item-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        title="Remove"
      >
        ×
      </button>
      <span className="tier-item-name">{item.name}</span>
    </div>
  );
}
