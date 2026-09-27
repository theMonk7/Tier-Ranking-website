import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTierList } from '../hooks/useTierList';
import { TierRow } from './TierRow';
import { UnrankedPool } from './UnrankedPool';
import { ImageUpload } from './ImageUpload';
import { Controls } from './Controls';

export function TierList() {
  const {
    state, addItems, moveItem, removeItem,
    renameTier, addTier, removeTier, changeTierColor,
    restart, resetAll, exportState, importState,
  } = useTierList();
  const [activeId, setActiveId] = useState<string | null>(null);
  const recentlyMovedRef = useRef(false);

  const containerIds = useMemo(
    () => new Set<string>(['pool', ...state.tierConfigs.map((t) => t.id)]),
    [state.tierConfigs]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findContainer = useCallback((id: string): string | null => {
    if (containerIds.has(id)) return id;
    if (state.pool.includes(id)) return 'pool';
    for (const tierId of Object.keys(state.tiers)) {
      if (state.tiers[tierId].includes(id)) return tierId;
    }
    return null;
  }, [state, containerIds]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    recentlyMovedRef.current = false;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeItemId);
    if (!activeContainer) return;

    let overContainer: string | null;
    if (containerIds.has(overId)) {
      overContainer = overId;
    } else {
      overContainer = findContainer(overId);
    }

    if (!overContainer || activeContainer === overContainer) return;

    const overItems = overContainer === 'pool' ? state.pool : (state.tiers[overContainer] || []);
    const overIndex = overItems.indexOf(overId);
    const newIndex = overIndex >= 0 ? overIndex : overItems.length;

    recentlyMovedRef.current = true;
    moveItem(activeItemId, activeContainer, overContainer, newIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItemId = active.id as string;
    const overId = over.id as string;

    if (recentlyMovedRef.current) {
      recentlyMovedRef.current = false;
      return;
    }

    const activeContainer = findContainer(activeItemId);
    if (!activeContainer || containerIds.has(overId)) return;

    const overContainer = findContainer(overId);
    if (activeContainer !== overContainer) return;

    const containerItems = activeContainer === 'pool' ? state.pool : (state.tiers[activeContainer] || []);
    const oldIndex = containerItems.indexOf(activeItemId);
    const newIndex = containerItems.indexOf(overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(containerItems, oldIndex, newIndex);
      const targetIndex = reordered.indexOf(activeItemId);
      moveItem(activeItemId, activeContainer, activeContainer, targetIndex);
    }
  };

  const activeItem = activeId ? state.items[activeId] : null;

  return (
    <div className="tier-list-app">
      <header className="app-header">
        <h1>⚡ TierGod ⚡</h1>
        <p className="subtitle">The Supreme Ranker of All Things</p>
        <div className="header-actions">
          <ImageUpload onUpload={addItems} />
          <Controls onExport={exportState} onImport={importState} onRestart={restart} onReset={resetAll} />
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="tiers-container">
          {state.tierConfigs.map((config) => (
            <TierRow
              key={config.id}
              config={config}
              items={(state.tiers[config.id] || []).map((id) => state.items[id]).filter(Boolean)}
              onRemove={removeItem}
              onRename={renameTier}
              onRemoveTier={removeTier}
              onChangeColor={changeTierColor}
            />
          ))}
          <button className="add-tier-btn" onClick={addTier}>
            + Add Tier
          </button>
        </div>

        <UnrankedPool
          items={state.pool.map((id) => state.items[id]).filter(Boolean)}
          onRemove={removeItem}
        />

        <DragOverlay>
          {activeItem ? (
            <div className="tier-item drag-overlay">
              <img src={activeItem.image} alt={activeItem.name} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
