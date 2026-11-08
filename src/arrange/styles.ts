import type { Style } from '../chart/model';

export type StyleGroup = 'Jazz' | 'Groove' | 'Latin';

/** How off-beat eighth notes are placed. */
export type Feel = 'straight' | 'swung8';

export interface StyleDef {
  id: Style;
  label: string;
  group: StyleGroup;
  defaultTempo: number;
  defaultSwing: number;
  /** Whether the mixer exposes the swing slider for this style. */
  swingEnabled: boolean;
  feel: Feel;
}

/**
 * Every playback feel in one place. `buildScore` reads `feel` and `swingEnabled`
 * instead of branching on style names, and the menus render straight from this map.
 */
export const STYLES: Record<Style, StyleDef> = {
  jazz: {
    id: 'jazz',
    label: 'Jazz Swing',
    group: 'Jazz',
    defaultTempo: 132,
    defaultSwing: 0.62,
    swingEnabled: true,
    feel: 'swung8',
  },
  ballad: {
    id: 'ballad',
    label: 'Jazz Ballad',
    group: 'Jazz',
    defaultTempo: 66,
    defaultSwing: 0.62,
    swingEnabled: true,
    feel: 'swung8',
  },
  shuffle: {
    id: 'shuffle',
    label: 'Blues Shuffle',
    group: 'Groove',
    defaultTempo: 120,
    // A shuffle is a fixed 12/8 feel, so the slider is disabled and the score
    // always uses full triplet placement.
    defaultSwing: 1,
    swingEnabled: false,
    feel: 'swung8',
  },
  rock: {
    id: 'rock',
    label: 'Rock',
    group: 'Groove',
    defaultTempo: 120,
    defaultSwing: 0,
    swingEnabled: false,
    feel: 'straight',
  },
  funk: {
    id: 'funk',
    label: 'Funk',
    group: 'Groove',
    defaultTempo: 100,
    defaultSwing: 0,
    swingEnabled: false,
    feel: 'straight',
  },
  bossa: {
    id: 'bossa',
    label: 'Bossa Nova',
    group: 'Latin',
    defaultTempo: 140,
    defaultSwing: 0,
    swingEnabled: false,
    feel: 'straight',
  },
};

/** Menu order, grouped by `group`. */
export const STYLE_ORDER: Style[] = ['jazz', 'ballad', 'shuffle', 'rock', 'funk', 'bossa'];

export const STYLE_GROUPS: StyleGroup[] = ['Jazz', 'Groove', 'Latin'];

export const styleLabel = (style: Style): string => STYLES[style]?.label ?? style;

export function groupedStyles(): Array<{ group: StyleGroup; styles: StyleDef[] }> {
  return STYLE_GROUPS.map((group) => ({
    group,
    styles: STYLE_ORDER.map((id) => STYLES[id]).filter((s) => s.group === group),
  }));
}

/** Effective swing for a style, clamped to 0–1. */
export function effectiveSwing(style: Style, swing: number): number {
  const def = STYLES[style];
  if (!def) return 0;
  if (!def.swingEnabled) return def.feel === 'swung8' ? def.defaultSwing : 0;
  return Math.max(0, Math.min(1, swing));
}
