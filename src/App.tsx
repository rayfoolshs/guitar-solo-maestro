import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  blueBossa, autumnLeaves, cantaloupeIsland, mrPC, misty, makeEmptyChart, parseSlots,
  setChord, setVisibleBars, slotRefs, autoName, beatsPerBar, prettyChord, transposeChart,
  type Chart, type Style,
} from './chart/model';
import { detectKey, makeKey, type KeyInfo } from './theory/keys';
import { suggestForChord, suggestGlobal, transitionScore, type Candidate } from './theory/suggest';
import { buildScore } from './arrange/buildScore';
import { downloadMidi } from './arrange/midi';
import { engine, type Position } from './audio/engine';
import type { LoadProgress } from './audio/soundfont';
import { Header } from './ui/Header';
import { Leadsheet } from './ui/Leadsheet';
import { Mixer } from './ui/Mixer';
import { Fretboard } from './ui/Fretboard';
import { StandardsModal } from './ui/StandardsModal';
import { ChartsModal } from './ui/ChartsModal';

const STORAGE_KEY = 'gsm.chart.v2';

type LoopMode = 'off' | 'visible' | 'range';

interface LoopState {
  mode: LoopMode;
  from: number; // 1-based
  to: number;
}

function loadChart(): Chart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Chart;
      if (parsed && Array.isArray(parsed.bars) && parsed.bars.length) {
        return { ...parsed, pianoOctave: parsed.pianoOctave ?? 0 };
      }
    }
  } catch { /* ignore */ }
  return autumnLeaves();
}

export default function App() {
  const [chart, setChart] = useState<Chart>(loadChart);
  const [selection, setSelection] = useState<{ bar: number; slotId: string | null }>({ bar: 5, slotId: null });
  const [view, setView] = useState<'fit' | 'comfortable'>('fit');
  const [loop, setLoop] = useState<LoopState>({ mode: 'visible', from: 1, to: 8 });
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState<Position>({ bar: 0, beat: 0, playing: false, counting: false });
  const [volumes, setVolumes] = useState({ piano: -6, bass: -9, drums: -8 });
  const [mutes, setMutes] = useState({ piano: false, bass: false, drums: false });
  const [tensions, setTensions] = useState(true);
  const [raf, setRaf] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [bank, setBank] = useState<LoadProgress>({ phase: 'idle', loaded: 0, total: 0 });
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);

  const key: KeyInfo = useMemo(
    () => (chart.keyManual ? makeKey(chart.keyManual.tonic, chart.keyManual.mode) : detectKey(parseSlots(chart)).key),
    [chart],
  );

  const detection = useMemo(() => detectKey(parseSlots(chart)), [chart]);

  const slots = useMemo(() => slotRefs(chart), [chart]);

  const suggestions = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    slots.forEach((s) => {
      if (s.chord) map.set(s.slotId, suggestForChord(s.chord, key));
    });
    return map;
  }, [slots, key]);

  const selectedSlot = slots.find((s) => s.slotId === selection.slotId) ?? slots.find((s) => s.barIndex === selection.bar);
  const selectedChord = selectedSlot?.chord ?? null;
  const selectedCandidates = selectedSlot ? suggestions.get(selectedSlot.slotId) ?? [] : [];
  const selectedCandidate: Candidate | null = selectedCandidates[0] ?? null;

  const global = useMemo(() => suggestGlobal(parseSlots(chart), key), [chart, key]);

  // persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chart)); } catch { /* ignore */ }
  }, [chart]);

  // transport loop
  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      const p = engine.position();
      setPosition(p);
      if (!p.playing) {
        setPlaying(false);
        return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    setRaf(id);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    (Object.keys(volumes) as Array<keyof typeof volumes>).forEach((ch) => {
      engine.setVolume(ch, volumes[ch]);
    });
  }, [volumes]);

  useEffect(() => {
    (Object.keys(mutes) as Array<keyof typeof mutes>).forEach((ch) => {
      engine.setMuted(ch, mutes[ch]);
    });
  }, [mutes]);

  // Live re-arrangement: style, swing and key changes apply from the next scheduled bar
  // instead of waiting for the next Play.
  useEffect(() => {
    if (!playing) return;
    engine.setEvents(buildScore(chart, key, { style: chart.style, swing: chart.swing }));
    // `chart` is read at call time; style/swing/key are the inputs that change the feel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, chart.style, chart.swing, key]);

  // Live tempo: the sounding bar finishes; the next bar starts at its queued time and
  // every bar after it uses the new tempo.
  useEffect(() => {
    if (!playing) return;
    engine.setTempo(chart.tempo);
  }, [playing, chart.tempo]);

  const range = useMemo(() => {
    const last = Math.max(0, chart.visibleBars - 1);
    if (loop.mode === 'range') {
      const a = Math.min(loop.from - 1, loop.to - 1);
      const b = Math.max(loop.from - 1, loop.to - 1);
      return { from: Math.max(0, a), to: Math.min(last, b) };
    }
    if (loop.mode === 'off') {
      const from = Math.min(selection.bar, last);
      return { from, to: last };
    }
    return { from: 0, to: last };
  }, [loop, chart.visibleBars, selection.bar]);

  const stop = useCallback(() => {
    engine.stop();
    setPlaying(false);
    setPosition({ bar: range.from, beat: 0, playing: false, counting: false });
  }, [range.from]);

  const play = useCallback(() => {
    if (playing) { stop(); return; }
    const score = buildScore(chart, key, { style: chart.style, swing: chart.swing });
    engine.ensure();
    (Object.keys(volumes) as Array<keyof typeof volumes>).forEach((ch) => engine.setVolume(ch, volumes[ch]));
    engine.prepareSoundfont(setBank).then((sf) => {
      if (!sf) return;
      (Object.keys(volumes) as Array<keyof typeof volumes>).forEach((ch) => engine.setVolume(ch, volumes[ch]));
    });
    engine.play(score, {
      tempo: chart.tempo,
      beatsPerBar: beatsPerBar(chart),
      fromBar: range.from,
      toBar: range.to,
      countIn: chart.countIn,
      loop: loop.mode !== 'off',
    });
    setPlaying(true);
  }, [playing, chart, key, range, loop.mode, volumes, stop]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.code === 'Space') { e.preventDefault(); play(); }
      if (e.key === 'l' || e.key === 'L') {
        setLoop((l) => ({ ...l, mode: l.mode === 'off' ? 'visible' : 'off' }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play]);

  const onSelect = (bar: number, slotId: string | null) => setSelection({ bar, slotId });

  const commitChord = (barIndex: number, beat: number, value: string) => {
    setChart((c) => setChord(c, barIndex, beat, value));
    setStatus(null);
  };

  const loadPreset = (preset: () => Chart, bar: number) => {
    stop();
    setChart(preset());
    setSelection({ bar, slotId: null });
    setStatus(null);
  };

  const exportMidiFile = () => {    const hasChords = chart.bars
      .slice(0, chart.visibleBars)
      .some((bar) => bar.slots.some((slot) => slot.input.trim()));
    if (!hasChords) {
      setStatus('Add at least one chord before exporting MIDI.');
      return;
    }
    const score = buildScore(chart, key, { style: chart.style, swing: chart.swing });
    downloadMidi(chart, score);
    setStatus(`Exported ${chart.name || 'chart'} as MIDI.`);
  };

  const transposeBy = (semitones: number) => {
    setChart((c) => transposeChart(c, semitones));
    setStatus(null);
  };

  const resetTranspose = () => {
    setChart((c) => {
      const offset = c.transpose ?? 0;
      return offset ? transposeChart(c, -offset) : c;
    });
  };

  const chartActions = {
    resetFour: () => setChart((c) => setVisibleBars(c, 4)),
    loadBlueBossa: () => loadPreset(blueBossa, 5),
    loadAutumnLeaves: () => loadPreset(autumnLeaves, 4),
    loadCantaloupeIsland: () => loadPreset(cantaloupeIsland, 0),
    loadMrPC: () => loadPreset(mrPC, 0),
    loadMisty: () => loadPreset(misty, 0),
    clear: () => setChart((c) => ({
      ...c,
      bars: c.bars.map((b) => ({ ...b, slots: [] })),
      pins: {},
    })),
    newChart: () => {
      const hasChords = chart.bars.some((bar) => bar.slots.some((slot) => slot.input.trim()));
      if (hasChords && !window.confirm('Start a new chart? The current chart will be replaced.')) return;
      loadPreset(makeEmptyChart, 0);
    },
    fit: () => setView((v) => (v === 'fit' ? 'comfortable' : 'fit')),
  };

  const setBarCount = (n: number) => setChart((c) => setVisibleBars(c, n));

  return (
    <div className="app">
      <Header
        chart={chart}
        keyName={key.name}
        confidence={detection.confidence}
        playing={playing}
        loop={loop}
        range={range}
        onPlay={play}
        onStop={stop}
        onLoopChange={setLoop}
        onTempo={(tempo) => setChart((c) => ({ ...c, tempo }))}
        onStyle={(style: Style) => setChart((c) => ({ ...c, style }))}
        onKeyChange={(name) => {
          const [tonic, mode] = name.split('|');
          setChart((c) => ({ ...c, keyManual: { tonic: Number(tonic), mode: mode as 'major' | 'minor' } }));
        }}
        onPrint={() => window.print()}
        onOpenStandards={() => setStandardsOpen(true)}
        onOpenCharts={() => setChartsOpen(true)}
        onExportMidi={exportMidiFile}
        actions={chartActions}
      />

      <StandardsModal
        open={standardsOpen}
        onClose={() => setStandardsOpen(false)}
        onLoad={(next) => loadPreset(() => next, 0)}
      />

      <ChartsModal
        open={chartsOpen}
        chart={chart}
        onClose={() => setChartsOpen(false)}
        onLoad={(next) => loadPreset(() => next, 0)}
      />

      <main>
        <Leadsheet
          chart={chart}
          keyInfo={key}
          view={view}
          selection={selection}
          playing={position.playing && !position.counting}
          playBar={position.bar}
          suggestions={suggestions}
          transitions={transitionScore}
          onSelect={onSelect}
          onCommit={commitChord}
          onBarCount={setBarCount}
          onToggleView={chartActions.fit}
          global={global}
          selectedCandidate={selectedCandidate}
          loop={loop}
          loopRange={range}
          onLoopRange={(fromBar, toBar) =>
            setLoop({ mode: 'range', from: fromBar + 1, to: toBar + 1 })
          }
        />

        <Mixer
          chart={chart}
          playing={playing}
          position={position}
          volumes={volumes}
          mutes={mutes}
          onVolume={(ch, db) => setVolumes((v) => ({ ...v, [ch]: db }))}
          onMute={(ch, m) => setMutes((m2) => ({ ...m2, [ch]: m }))}
          onSwing={(swing) => setChart((c) => ({ ...c, swing }))}
          transpose={chart.transpose ?? 0}
          onTranspose={transposeBy}
          onTransposeReset={resetTranspose}
          pianoOctave={chart.pianoOctave ?? 0}
          onPianoOctave={(v) => setChart((c) => ({ ...c, pianoOctave: Math.max(-2, Math.min(2, v)) }))}
          onTempo={(tempo) => setChart((c) => ({ ...c, tempo }))}
          onStyle={(style) => setChart((c) => ({ ...c, style }))}
          onPlay={play}
          onStop={stop}
          range={range}
          loop={loop}
          bank={bank}
        />

        <section className="card whylane">
          {selectedChord && selectedCandidate ? (
            <>
              <span className="k">Bar {selectedSlot!.barIndex + 1} · beat {selectedSlot!.beat + 1}</span>
              <b>{prettyChord(selectedChord.input)}</b>
              <span className="sep">·</span>
              <b className="amber">{selectedCandidate.name}</b>
              <span className="mono">{selectedCandidate.degrees}</span>
              <span className="sep">·</span>
              <span>{selectedCandidate.parent ?? 'derived scale'}</span>
              <span className="sep">·</span>
              <span className={selectedCandidate.added.length ? 'warn' : 'ok'}>
                {selectedCandidate.reason}
              </span>
            </>
          ) : (
            <span className="muted">Select a chord to see why the scale fits.</span>
          )}
        </section>

        <Fretboard
          candidate={selectedCandidate}
          chordPcs={selectedChord ? selectedChord.intervals : []}
          rootPc={selectedCandidate?.rootPc ?? 0}
          flats={key.flats}
          tensions={tensions}
          onToggleTensions={() => setTensions((t) => !t)}
          playingBar={playing ? position.bar : -1}
          playBeat={playing ? position.beat : 0}
        />
      </main>
      {status && <div className="toast">{status}</div>}
    </div>
  );
}
