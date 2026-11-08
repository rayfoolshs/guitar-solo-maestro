import { uid, type Bar, type Chart, type ChordSlot, type Style } from './model';
import { STYLES } from '../arrange/styles';

export const CHART_FORMAT = 'guitar-solo-maestro/chart';
export const CHART_FILE_VERSION = 1;
export const MAX_CHART_BYTES = 1_000_000;
const MAX_BARS = 256;
const MAX_SLOTS_PER_BAR = 8;

export interface ChartFile {
  format: typeof CHART_FORMAT;
  version: number;
  savedAt: string;
  chart: Chart;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asBool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const wrapTranspose = (value: unknown): number => {
  const rounded = Math.round(asNumber(value, 0));
  const wrapped = ((rounded % 12) + 12) % 12;
  return wrapped > 6 ? wrapped - 12 : wrapped;
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);

const safeId = (value: unknown, used: Set<string>, prefix: string): string => {
  const candidate = asString(value);
  if (SAFE_ID.test(candidate) && !FORBIDDEN_IDS.has(candidate) && !used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  let id = uid(prefix);
  while (used.has(id)) id = uid(prefix);
  used.add(id);
  return id;
};

const safeName = (value: unknown, fallback: string): string => {
  const name = asString(value).trim().slice(0, 120);
  return name || fallback;
};

/**
 * Build a fresh Chart from untrusted data, field by field. Never spreads the
 * parsed object, so unknown keys and prototype tricks cannot reach app state.
 * Returns null when there is no usable bar data.
 */
export function normalizeChart(input: unknown): Chart | null {
  if (!isObject(input)) return null;

  const timeSignature: Chart['timeSignature'] = input.timeSignature === '3/4' ? '3/4' : '4/4';
  const bpb = timeSignature === '3/4' ? 3 : 4;

  const rawBars = Array.isArray(input.bars) ? input.bars.slice(0, MAX_BARS) : [];
  const usedBarIds = new Set<string>();
  const usedSlotIds = new Set<string>();

  const bars: Bar[] = rawBars
    .filter(isObject)
    .map((rawBar) => {
      const rawSlots = Array.isArray(rawBar.slots) ? rawBar.slots.slice(0, MAX_SLOTS_PER_BAR) : [];
      const slots: ChordSlot[] = rawSlots
        .filter(isObject)
        .map((rawSlot) => {
          const inputChord = asString(rawSlot.input).trim().slice(0, 40);
          if (!inputChord) return null;
          return {
            id: safeId(rawSlot.id, usedSlotIds, 's'),
            beat: Math.round(clamp(asNumber(rawSlot.beat, 0), 0, bpb - 0.25) * 100) / 100,
            input: inputChord,
          };
        })
        .filter((slot): slot is ChordSlot => !!slot)
        .sort((a, b) => a.beat - b.beat);
      return { id: safeId(rawBar.id, usedBarIds, 'b'), slots };
    });

  if (rawBars.length === 0) return null;

  while (bars.length < 4) bars.push({ id: safeId(undefined, usedBarIds, 'b'), slots: [] });

  const pinsInput = isObject(input.pins) ? input.pins : {};
  const pins: Record<string, string> = {};
  for (const bar of bars) {
    for (const slot of bar.slots) {
      const pin = pinsInput[slot.id];
      if (typeof pin === 'string' && pin && SAFE_ID.test(pin)) pins[slot.id] = pin.slice(0, 40);
    }
  }

  const rawKey = isObject(input.keyManual) ? input.keyManual : null;
  const tonic = rawKey ? asNumber(rawKey.tonic, -1) : -1;
  const mode: 'major' | 'minor' | null =
    rawKey?.mode === 'major' || rawKey?.mode === 'minor' ? rawKey.mode : null;
  const keyManual = mode && tonic >= 0 && tonic <= 11
    ? { tonic: Math.round(tonic), mode }
    : null;

  const style = typeof input.style === 'string' && Object.prototype.hasOwnProperty.call(STYLES, input.style)
    ? (input.style as Style)
    : 'jazz';

  const metadata: Pick<Chart, 'composer' | 'year' | 'form' | 'tags'> = {};
  const composer = asString(input.composer).trim().slice(0, 120);
  if (composer) metadata.composer = composer;
  const year = asNumber(input.year, NaN);
  if (Number.isInteger(year) && year > 1000 && year < 3000) metadata.year = year;
  const form = asString(input.form).trim().slice(0, 60);
  if (form) metadata.form = form;
  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 24)).filter(Boolean))].slice(0, 8)
    : [];
  if (tags.length) metadata.tags = tags;

  const maxVisible = Math.min(64, bars.length);
  const visibleBars = clamp(
    Math.round(asNumber(input.visibleBars, bars.length)),
    Math.min(4, maxVisible),
    maxVisible,
  );

  return {
    id: uid('c'),
    name: safeName(input.name, ''),
    timeSignature,
    bars,
    visibleBars,
    keyManual,
    tempo: Math.round(clamp(asNumber(input.tempo, 120), 40, 220)),
    style,
    swing: clamp(asNumber(input.swing, 0.62), 0, 1),
    countIn: asBool(input.countIn, true),
    metronome: asBool(input.metronome, false),
    pianoOctave: Math.round(clamp(asNumber(input.pianoOctave, 0), -2, 2)),
    pins,
    transpose: wrapTranspose(input.transpose),
    ...metadata,
  };
}

export function serializeChart(chart: Chart): ChartFile {
  return {
    format: CHART_FORMAT,
    version: CHART_FILE_VERSION,
    savedAt: new Date().toISOString(),
    chart,
  };
}

export type ParseResult = { ok: true; chart: Chart } | { ok: false; error: string };

export function parseChartText(text: string): ParseResult {
  if (text.length > MAX_CHART_BYTES) return { ok: false, error: 'That file is too large (1 MB maximum).' };

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  if (!isObject(data)) return { ok: false, error: 'That file is not a chart.' };
  const candidate = isObject(data.chart) ? data.chart : data;
  const chart = normalizeChart(candidate);
  if (!chart) return { ok: false, error: 'No chord chart found in that file.' };
  return { ok: true, chart };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'chart';
}

/** Serialize and download the chart as a .gsm.json file. */
export function downloadChart(chart: Chart): void {
  const blob = new Blob([JSON.stringify(serializeChart(chart), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(chart.name || 'chart')}.gsm.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
