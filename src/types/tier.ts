export interface TierItem {
  id: string;
  name: string;
  image: string; // base64 data URL
}

export interface TierConfig {
  id: string;
  label: string;
  color: string;
}

export interface TierListState {
  version: number;
  tierConfigs: TierConfig[]; // ordered tier definitions
  tiers: Record<string, string[]>; // tier id -> ordered item ids
  pool: string[]; // unranked item ids
  items: Record<string, TierItem>; // all items by id
}

export const DEFAULT_TIER_CONFIGS: TierConfig[] = [
  { id: 'S', label: 'S', color: '#ff7f7f' },
  { id: 'A', label: 'A', color: '#ffbf7f' },
  { id: 'B', label: 'B', color: '#ffdf7f' },
  { id: 'C', label: 'C', color: '#ffff7f' },
  { id: 'D', label: 'D', color: '#bfff7f' },
  { id: 'F', label: 'F', color: '#7fffff' },
];

export const TIER_COLORS = [
  '#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f',
  '#bfff7f', '#7fffff', '#7fbfff', '#bf7fff',
  '#ff7fbf', '#ff9f9f',
];

export const DEFAULT_STATE: TierListState = {
  version: 2,
  tierConfigs: DEFAULT_TIER_CONFIGS,
  tiers: { S: [], A: [], B: [], C: [], D: [], F: [] },
  pool: [],
  items: {},
};
