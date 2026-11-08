import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeEmptyChart } from '../src/chart/model';
import {
  LIBRARY_KEY, MAX_SAVED_CHARTS, duplicate, listSaved, overwrite, read, remove, rename, saveNew,
} from '../src/chart/library';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  failNext = false;

  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('QuotaExceededError');
    }
    this.data.set(key, value);
  }
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('localStorage', store);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('chart library', () => {
  it('saves, lists and reads a chart', () => {
    const chart = makeEmptyChart();
    const result = saveNew(chart);
    expect(result.ok).toBe(true);
    const saved = listSaved();
    expect(saved.length).toBe(1);
    expect(saved[0].name).toBe('Untitled chart');
    expect(read(saved[0].id)?.name).toBe('Untitled chart');
  });

  it('uses the supplied name', () => {
    const result = saveNew(makeEmptyChart(), '  My Tune  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.saved.name).toBe('My Tune');
  });

  it('lists newest first', () => {
    saveNew(makeEmptyChart(), 'First');
    vi.setSystemTime(new Date('2026-01-01T00:00:05Z'));
    saveNew(makeEmptyChart(), 'Second');
    expect(listSaved().map((s) => s.name)).toEqual(['Second', 'First']);
  });

  it('renames, duplicates and overwrites', () => {
    const saved = saveNew(makeEmptyChart(), 'Original');
    if (!saved.ok) throw new Error('save failed');

    const renamed = rename(saved.saved.id, 'Renamed');
    expect(renamed.ok).toBe(true);
    if (renamed.ok) expect(renamed.saved.name).toBe('Renamed');

    const copy = duplicate(saved.saved.id);
    expect(copy.ok).toBe(true);
    if (copy.ok) expect(copy.saved.name).toBe('Renamed copy');
    expect(listSaved().length).toBe(2);

    const updated = overwrite(saved.saved.id, { ...makeEmptyChart(), tempo: 77 });
    expect(updated.ok).toBe(true);
    const loaded = read(saved.saved.id);
    expect(loaded?.tempo).toBe(77);
    expect(loaded?.name).toBe('Renamed');
  });

  it('deletes a chart', () => {
    const saved = saveNew(makeEmptyChart());
    if (!saved.ok) throw new Error('save failed');
    expect(remove(saved.saved.id)).toBe(true);
    expect(listSaved().length).toBe(0);
    expect(remove('missing')).toBe(false);
  });

  it('caps the library size', () => {
    for (let i = 0; i < MAX_SAVED_CHARTS; i++) {
      const result = saveNew(makeEmptyChart(), `Chart ${i}`);
      expect(result.ok, `save ${i}`).toBe(true);
    }
    const overflow = saveNew(makeEmptyChart(), 'One too many');
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.error).toMatch(/up to/i);
  });

  it('reports quota failures instead of throwing', () => {
    store.failNext = true;
    const result = saveNew(makeEmptyChart(), 'Full');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/storage is full/i);
  });

  it('ignores corrupted storage', () => {
    store.setItem(LIBRARY_KEY, 'not json');
    expect(listSaved()).toEqual([]);
    store.setItem(LIBRARY_KEY, JSON.stringify({ charts: [{ name: 'nope' }] }));
    expect(listSaved()).toEqual([]);
  });
});
