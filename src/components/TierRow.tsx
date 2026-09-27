import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { TierConfig, TierItem, TIER_COLORS } from '../types/tier';
import { TierItemCard } from './TierItemCard';

interface Props {
  config: TierConfig;
  items: TierItem[];
  onRemove: (id: string) => void;
  onRename: (tierId: string, newLabel: string) => void;
  onRemoveTier: (tierId: string) => void;
  onChangeColor: (tierId: string, color: string) => void;
}

export function TierRow({ config, items, onRemove, onRename, onRemoveTier, onChangeColor }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: config.id });
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(config.label);
  const [showSettings, setShowSettings] = useState(false);

  const handleDoubleClick = () => {
    setEditValue(config.label);
    setEditing(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onRename(config.id, trimmed);
    }
    setEditing(false);
  };

  const handleRemoveTier = () => {
    if (window.confirm(`Remove tier "${config.label}"? Items will move back to pool.`)) {
      onRemoveTier(config.id);
    }
  };

  return (
    <div className={`tier-row ${isOver ? 'tier-row-over' : ''}`}>
      <div
        className="tier-label"
        style={{ backgroundColor: config.color }}
        onDoubleClick={handleDoubleClick}
      >
        {editing ? (
          <input
            className="tier-label-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
            maxLength={10}
          />
        ) : (
          <span>{config.label}</span>
        )}
        <button
          className="tier-settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Tier settings"
        >
          ⋮
        </button>
        {showSettings && (
          <div className="tier-settings-popup">
            <div className="tier-color-picker">
              {TIER_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${config.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => { onChangeColor(config.id, color); setShowSettings(false); }}
                />
              ))}
            </div>
            <button className="tier-delete-btn" onClick={handleRemoveTier}>
              🗑️ Remove Tier
            </button>
          </div>
        )}
      </div>
      <div ref={setNodeRef} className="tier-content">
        <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
          {items.map((item) => (
            <TierItemCard key={item.id} item={item} onRemove={onRemove} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
