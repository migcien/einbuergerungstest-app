export type BundeslandKey = 'nw';

export type Bundesland = {
  key: BundeslandKey;
  label: string;
  shortLabel: string;
};

export const DEFAULT_BUNDESLAND: BundeslandKey = 'nw';

export const BUNDESLAENDER: Bundesland[] = [
  {
    key: 'nw',
    label: 'Nordrhein-Westfalen',
    shortLabel: 'NRW',
  },
];

export function isBundeslandKey(value: unknown): value is BundeslandKey {
  return BUNDESLAENDER.some((state) => state.key === value);
}

export function resolveBundesland(value: string | string[] | undefined): BundeslandKey {
  const raw = Array.isArray(value) ? value[0] : value;
  if (isBundeslandKey(raw)) {
    return raw;
  }

  return DEFAULT_BUNDESLAND;
}

export function getBundeslandLabel(key: BundeslandKey): string {
  const match = BUNDESLAENDER.find((state) => state.key === key);
  return match ? match.label : 'Unknown';
}
