import { autoName, uid, type Chart } from './model';
import { normalizeChart } from './io';

export const LIBRARY_KEY = 'gsm.charts.v1';
export const MAX_SAVED_CHARTS = 100;
export const MAX_LIBRARY_BYTES = 1_000_000;

export interface SavedChart {
  id: string;
  name: string;
  savedAt: string;
  chart: Chart;
}

export type LibraryResult =
  | { ok: true; saved: SavedChart }
  | { ok: false; error: string };

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

const now = () => new Date().toISOString();

const cleanName = (name: string | undefined, chart: Chart): string => {
  const trimmed = (name ?? chart.name ?? '').trim().slice(0, 120);
  return trimmed || autoName(chart);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function readAll(): SavedChart[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.charts) ? parsed.charts : [];
    const saved: SavedChart[] = [];
    for (const entry of list) {
      if (!isRecord(entry)) continue;
      const chart = normalizeChart(entry.chart);
      if (!chart) continue;
      const id = typeof entry.id === 'string' && entry.id ? entry.id : uid('lib');
      const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim().slice(0, 120) : autoName(chart);
      const savedAt = typeof entry.savedAt === 'string' && !Number.isNaN(Date.parse(entry.savedAt))
        ? entry.savedAt
        : new Date(0).toISOString();
      saved.push({ id, name, savedAt, chart });
    }
    return saved.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  } catch {
    return [];
  }
}

/** Returns an error message, or null on success. */
function persist(charts: SavedChart[]): string | null {
  const store = storage();
  if (!store) return 'Browser storage is unavailable.';
  const payload = JSON.stringify({ version: 1, charts });
  if (payload.length > MAX_LIBRARY_BYTES) return 'The chart library is full (1 MB limit).';
  try {
    store.setItem(LIBRARY_KEY, payload);
    return null;
  } catch {
    return 'Storage is full — delete a chart and try again.';
  }
}

export function listSaved(): SavedChart[] {
  return readAll();
}

export function saveNew(chart: Chart, name?: string): LibraryResult {
  const all = readAll();
  if (all.length >= MAX_SAVED_CHARTS) {
    return { ok: false, error: `You can save up to ${MAX_SAVED_CHARTS} charts.` };
  }
  const finalName = cleanName(name, chart);
  const saved: SavedChart = {
    id: uid('lib'),
    name: finalName,
    savedAt: now(),
    chart: { ...chart, name: finalName },
  };
  const error = persist([saved, ...all]);
  return error ? { ok: false, error } : { ok: true, saved };
}

export function overwrite(id: string, chart: Chart): LibraryResult {
  const all = readAll();
  const index = all.findIndex((entry) => entry.id === id);
  if (index === -1) return { ok: false, error: 'That saved chart no longer exists.' };
  const saved: SavedChart = {
    ...all[index],
    savedAt: now(),
    chart: { ...chart, name: all[index].name },
  };
  all[index] = saved;
  const error = persist(all);
  return error ? { ok: false, error } : { ok: true, saved };
}

export function rename(id: string, name: string): LibraryResult {
  const all = readAll();
  const index = all.findIndex((entry) => entry.id === id);
  if (index === -1) return { ok: false, error: 'That saved chart no longer exists.' };
  const finalName = cleanName(name, all[index].chart);
  const saved: SavedChart = {
    ...all[index],
    name: finalName,
    chart: { ...all[index].chart, name: finalName },
  };
  all[index] = saved;
  const error = persist(all);
  return error ? { ok: false, error } : { ok: true, saved };
}

export function duplicate(id: string): LibraryResult {
  const all = readAll();
  const source = all.find((entry) => entry.id === id);
  if (!source) return { ok: false, error: 'That saved chart no longer exists.' };
  if (all.length >= MAX_SAVED_CHARTS) {
    return { ok: false, error: `You can save up to ${MAX_SAVED_CHARTS} charts.` };
  }
  const name = `${source.name} copy`.slice(0, 120);
  const saved: SavedChart = {
    id: uid('lib'),
    name,
    savedAt: now(),
    chart: { ...source.chart, name },
  };
  const error = persist([saved, ...all]);
  return error ? { ok: false, error } : { ok: true, saved };
}

export function remove(id: string): boolean {
  const all = readAll();
  const next = all.filter((entry) => entry.id !== id);
  if (next.length === all.length) return false;
  return persist(next) === null;
}

export function read(id: string): Chart | null {
  const entry = readAll().find((saved) => saved.id === id);
  return entry ? { ...entry.chart, name: entry.name } : null;
}
