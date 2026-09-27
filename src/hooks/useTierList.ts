import { useCallback } from 'react';
import { TierListState, TierItem, TierConfig, TIER_COLORS, DEFAULT_STATE, DEFAULT_TIER_CONFIGS } from '../types/tier';
import { useLocalStorage } from './useLocalStorage';
import { processImage } from '../utils/imageProcessor';

const STORAGE_KEY = 'tiergod-state';

function migrateState(raw: TierListState): TierListState {
  // Migrate v1 → v2: add tierConfigs if missing
  if (!raw.tierConfigs) {
    return { ...raw, version: 2, tierConfigs: DEFAULT_TIER_CONFIGS };
  }
  return raw;
}

export function useTierList() {
  const [rawState, setRawState] = useLocalStorage<TierListState>(STORAGE_KEY, DEFAULT_STATE);
  const state = migrateState(rawState);

  // Wrap setState to always migrate prev before operating on it
  const setState = useCallback((updater: TierListState | ((prev: TierListState) => TierListState)) => {
    setRawState((prev) => {
      const migrated = migrateState(prev);
      return updater instanceof Function ? updater(migrated) : updater;
    });
  }, [setRawState]);

  const addItems = useCallback(async (files: File[]) => {
    const newItems: TierItem[] = [];
    for (const file of files) {
      try {
        const image = await processImage(file);
        const id = crypto.randomUUID();
        const name = file.name.replace(/\.[^.]+$/, '');
        newItems.push({ id, name, image });
      } catch (e) {
        console.warn('Failed to process image:', file.name, e);
      }
    }

    if (newItems.length === 0) return;

    setState((prev) => {
      const items = { ...prev.items };
      const pool = [...prev.pool];
      for (const item of newItems) {
        items[item.id] = item;
        pool.push(item.id);
      }
      return { ...prev, items, pool };
    });
  }, [setState]);

  const moveItem = useCallback((
    itemId: string,
    _fromContainer: string,
    toContainer: string,
    toIndex: number
  ) => {
    setState((prev) => {
      // Find actual current container from prev state
      let actualFrom: string | null = null;
      if (prev.pool.includes(itemId)) {
        actualFrom = 'pool';
      } else {
        for (const tid of Object.keys(prev.tiers)) {
          if (prev.tiers[tid].includes(itemId)) {
            actualFrom = tid;
            break;
          }
        }
      }
      if (!actualFrom) return prev;
      if (actualFrom === toContainer) {
        // Reorder within same container
        const list = actualFrom === 'pool' ? [...prev.pool] : [...prev.tiers[actualFrom]];
        const oldIndex = list.indexOf(itemId);
        if (oldIndex === -1 || toIndex === oldIndex) return prev;
        list.splice(oldIndex, 1);
        list.splice(toIndex, 0, itemId);
        const next = { ...prev, tiers: { ...prev.tiers }, pool: [...prev.pool] };
        if (actualFrom === 'pool') {
          next.pool = list;
        } else {
          next.tiers[actualFrom] = list;
        }
        return next;
      }

      const next = { ...prev, tiers: { ...prev.tiers }, pool: [...prev.pool] };

      // Remove from actual source
      if (actualFrom === 'pool') {
        next.pool = next.pool.filter((id) => id !== itemId);
      } else {
        next.tiers[actualFrom] = next.tiers[actualFrom].filter((id) => id !== itemId);
      }

      // Insert into destination
      if (toContainer === 'pool') {
        next.pool.splice(toIndex, 0, itemId);
      } else {
        next.tiers[toContainer] = [...(next.tiers[toContainer] || [])];
        next.tiers[toContainer].splice(toIndex, 0, itemId);
      }

      return next;
    });
  }, [setState]);

  const removeItem = useCallback((itemId: string) => {
    setState((prev) => {
      const next = { ...prev, tiers: { ...prev.tiers }, pool: [...prev.pool], items: { ...prev.items } };
      next.pool = next.pool.filter((id) => id !== itemId);
      for (const tierId of Object.keys(next.tiers)) {
        next.tiers[tierId] = next.tiers[tierId].filter((id) => id !== itemId);
      }
      delete next.items[itemId];
      return next;
    });
  }, [setState]);

  // --- Tier config management ---

  const renameTier = useCallback((tierId: string, newLabel: string) => {
    setState((prev) => ({
      ...prev,
      tierConfigs: prev.tierConfigs.map((t) =>
        t.id === tierId ? { ...t, label: newLabel } : t
      ),
    }));
  }, [setState]);

  const addTier = useCallback(() => {
    setState((prev) => {
      const id = crypto.randomUUID().slice(0, 8);
      const colorIndex = prev.tierConfigs.length % TIER_COLORS.length;
      const newConfig: TierConfig = { id, label: '?', color: TIER_COLORS[colorIndex] };
      return {
        ...prev,
        tierConfigs: [...prev.tierConfigs, newConfig],
        tiers: { ...prev.tiers, [id]: [] },
      };
    });
  }, [setState]);

  const removeTier = useCallback((tierId: string) => {
    setState((prev) => {
      const itemsInTier = prev.tiers[tierId] || [];
      const newTiers = { ...prev.tiers };
      delete newTiers[tierId];
      return {
        ...prev,
        tierConfigs: prev.tierConfigs.filter((t) => t.id !== tierId),
        tiers: newTiers,
        pool: [...itemsInTier, ...prev.pool], // move items back to pool
      };
    });
  }, [setState]);

  const changeTierColor = useCallback((tierId: string, color: string) => {
    setState((prev) => ({
      ...prev,
      tierConfigs: prev.tierConfigs.map((t) =>
        t.id === tierId ? { ...t, color } : t
      ),
    }));
  }, [setState]);

  // --- Session controls ---

  const restart = useCallback(() => {
    setState((prev) => {
      const allTierItems = Object.keys(prev.tiers).flatMap((t) => prev.tiers[t]);
      const emptyTiers: Record<string, string[]> = {};
      for (const config of prev.tierConfigs) {
        emptyTiers[config.id] = [];
      }
      return {
        ...prev,
        tiers: emptyTiers,
        pool: [...allTierItems, ...prev.pool],
      };
    });
  }, [setState]);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, [setState]);

  const exportState = useCallback(() => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiergod-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importState = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as TierListState;
      if (!parsed.items || !parsed.tiers || !parsed.pool) {
        throw new Error('Invalid format');
      }
      // Migrate v1 state that doesn't have tierConfigs
      if (!parsed.tierConfigs) {
        parsed.tierConfigs = DEFAULT_STATE.tierConfigs;
      }
      setState(parsed);
    } catch (e) {
      alert('Failed to import: invalid file format');
      console.error(e);
    }
  }, [setState]);

  return {
    state,
    addItems,
    moveItem,
    removeItem,
    renameTier,
    addTier,
    removeTier,
    changeTierColor,
    restart,
    resetAll,
    exportState,
    importState,
  };
}
