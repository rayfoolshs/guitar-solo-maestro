import { WorkletSynthesizer } from 'spessasynth_lib';
// Served as a static asset and registered with audioWorklet.addModule().
import processorUrl from 'spessasynth_lib/dist/spessasynth_processor.min.js?url';

export type LoadPhase = 'idle' | 'worklet' | 'download' | 'bank' | 'ready' | 'error';

export interface LoadProgress {
  phase: LoadPhase;
  loaded: number;
  total: number;
  message?: string;
}

const BANK_URL = new URL('soundfonts/GeneralUser-GS.sf2', document.baseURI).href;

let synth: WorkletSynthesizer | null = null;
let loading: Promise<WorkletSynthesizer | null> | null = null;

export const MIDI_CHANNEL = { piano: 0, bass: 1, drums: 9 } as const;

/** dB (−60…+6) → MIDI CC7 (0…127), using the usual concave volume curve. */
export function dbToCC7(db: number): number {
  if (db <= -60) return 0;
  const gain = Math.pow(10, db / 20);
  return Math.max(1, Math.min(127, Math.round(127 * Math.sqrt(gain))));
}

export function hasSoundfont(): boolean {
  return synth !== null;
}

export function getSoundfont(): WorkletSynthesizer | null {
  return synth;
}

/**
 * Loads the General MIDI bank once. Safe to call repeatedly; the promise is shared.
 * Returns null when the bank or worklet cannot be loaded (the caller falls back
 * to the built-in synth).
 */
export function loadSoundfont(
  ctx: AudioContext,
  onProgress: (p: LoadProgress) => void = () => {},
): Promise<WorkletSynthesizer | null> {
  if (synth) return Promise.resolve(synth);
  if (loading) return loading;

  loading = (async () => {
    try {
      onProgress({ phase: 'worklet', loaded: 0, total: 0 });
      await ctx.audioWorklet.addModule(processorUrl);

      const s = new WorkletSynthesizer(ctx);
      await s.isReady;

      onProgress({ phase: 'download', loaded: 0, total: 0 });
      const res = await fetch(BANK_URL);
      if (!res.ok) throw new Error(`bank ${res.status}`);
      const total = Number(res.headers.get('content-length') || 0);
      let loaded = 0;
      const chunks: Uint8Array[] = [];
      const reader = res.body?.getReader();

      if (!reader) {
        const buf = await res.arrayBuffer();
        loaded = buf.byteLength;
        chunks.push(new Uint8Array(buf));
      } else {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.byteLength;
            onProgress({ phase: 'download', loaded, total });
          }
        }
      }

      const buffer = new Uint8Array(loaded);
      let offset = 0;
      for (const c of chunks) {
        buffer.set(c, offset);
        offset += c.byteLength;
      }

      onProgress({ phase: 'bank', loaded, total: loaded });
      await s.soundBankManager.addSoundBank(buffer.buffer, 'gm');

      s.connect(ctx.destination);

      // piano on channel 0, bass on 1, drums on 10
      s.programChange(MIDI_CHANNEL.piano, 0);
      s.programChange(MIDI_CHANNEL.bass, 32);
      s.controllerChange(MIDI_CHANNEL.piano, 7, dbToCC7(-6));
      s.controllerChange(MIDI_CHANNEL.bass, 7, dbToCC7(-9));
      s.controllerChange(MIDI_CHANNEL.drums, 7, dbToCC7(-8));

      synth = s;
      onProgress({ phase: 'ready', loaded: total, total });
      return s;
    } catch (err) {
      console.warn('[soundfont] falling back to the built-in synth', err);
      onProgress({ phase: 'error', loaded: 0, total: 0, message: String(err) });
      return null;
    } finally {
      loading = null;
    }
  })();

  return loading;
}
