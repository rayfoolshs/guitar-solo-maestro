import { useEffect, useState } from 'react';
import type { Chart } from '../chart/model';
import { autoName, beatsPerBar, prettyChord } from '../chart/model';
import type { KeyInfo } from '../theory/keys';
import { mod12 } from '../theory/pitch';
import type { Candidate } from '../theory/suggest';

const SHARP_STEPS = [0, 3, -2, 2, 5, 1, 4];
const FLAT_STEPS = [4, 1, 5, 2, 6, 3, 7];

function keySignature(key: KeyInfo): { count: number; flats: boolean } {
  const rel = key.mode === 'major' ? key.tonic : mod12(key.tonic + 3);
  const sharps: Record<number, number> = { 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 1: 7 };
  const flats: Record<number, number> = { 5: 1, 10: 2, 3: 3, 8: 4, 1: 5, 6: 6, 11: 7 };
  const s = sharps[rel] ?? 0;
  const f = flats[rel] ?? 0;
  return key.flats ? { count: f || s, flats: true } : { count: s || f, flats: false };
}

interface Props {
  chart: Chart;
  keyInfo: KeyInfo;
  view: 'fit' | 'comfortable';
  selection: { bar: number; slotId: string | null };
  playing: boolean;
  playBar: number;
  suggestions: Map<string, Candidate[]>;
  transitions: (a: number[], b: number[]) => number;
  onSelect: (bar: number, slotId: string | null) => void;
  onCommit: (bar: number, beat: number, value: string) => void;
  onBarCount: (n: number) => void;
  onToggleView: () => void;
  global: Candidate[];
  selectedCandidate: Candidate | null;
  loop: { mode: 'off' | 'visible' | 'range'; from: number; to: number };
  loopRange: { from: number; to: number };
  onLoopRange: (fromBar: number, toBar: number) => void;
}

/** Left gutter must fit the clef, the key signature and the time signature. */
const gutterFor = (accidentals: number) => 64 + accidentals * 12;

export function Leadsheet(props: Props) {
  const { chart, keyInfo, view, selection, playing, playBar, suggestions, transitions, onSelect, onCommit, onBarCount, onToggleView, global } = props;
  const bpb = beatsPerBar(chart);
  const sig = keySignature(keyInfo);
  const styleLabel = chart.style === 'jazz' ? 'Jazz Swing' : chart.style === 'rock' ? 'Rock' : 'Bossa Nova';

  const [edit, setEdit] = useState<{ bar: number; beat: number; value: string } | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);

  useEffect(() => { setEdit(null); }, [chart.id]);

  useEffect(() => {
    if (!drag) return;
    const finish = () => {
      const from = Math.min(drag.a, drag.b);
      const to = Math.max(drag.a, drag.b);
      props.onLoopRange(from, to);
      setDrag(null);
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [drag, props]);

  const visible = chart.bars.slice(0, chart.visibleBars);

  function renderChart(perSystem: number, gutter: number, interactive: boolean) {
    const systems: typeof visible[] = [];
    for (let i = 0; i < visible.length; i += perSystem) systems.push(visible.slice(i, i + perSystem));
    const gridCols = `${gutter}px repeat(${perSystem}, 1fr)`;

    return systems.map((sys, si) => {
      const startBar = si * perSystem;
      const sysEnd = startBar + sys.length - 1;
      const range = drag
        ? { from: Math.min(drag.a, drag.b), to: Math.max(drag.a, drag.b) }
        : props.loop.mode === 'range'
          ? props.loopRange
          : null;
      const showBand = !!range && range.from <= sysEnd && range.to >= startBar;
      const bandFrom = showBand ? Math.max(range!.from, startBar) - startBar : 0;
      const bandTo = showBand ? Math.min(range!.to, sysEnd) - startBar : 0;

      return (
        <div className="sys" key={`${interactive ? 's' : 'p'}${si}`}>
          {showBand && (
            <div
              className={`loopband${drag ? ' live' : ''}`}
              style={{
                left: `calc(${gutter}px + (100% - ${gutter}px) * ${bandFrom / perSystem})`,
                width: `calc((100% - ${gutter}px) * ${(bandTo - bandFrom + 1) / perSystem})`,
              }}
            />
          )}
          <div className="sysnum">{startBar + 1}</div>

          <div className="chordrow" style={{ gridTemplateColumns: gridCols }}>
            <div />
            {sys.map((bar, bi) => {
              const barIndex = startBar + bi;
              const active = interactive && playing && playBar === barIndex;
              return (
                <div
                  className={`barx${active ? ' playing' : ''}`}
                  key={bar.id}
                  onPointerDown={interactive ? (e) => {
                    const el = e.target as HTMLElement;
                    if (el.closest('.chordbtn') || el.closest('input')) return;
                    e.preventDefault();
                    onSelect(barIndex, null);
                    setDrag({ a: barIndex, b: barIndex });
                  } : undefined}
                  onPointerEnter={interactive ? () => setDrag((d) => (d ? { ...d, b: barIndex } : d)) : undefined}
                >
                  {Array.from({ length: bpb }).map((_, beat) => {
                    const slot = bar.slots.find((s) => s.beat === beat);
                    const isEditing = interactive && edit && edit.bar === barIndex && edit.beat === beat;
                    const leftPct = (beat / bpb) * 100;
                    return (
                      <div key={beat} className={`slot${slot ? ' has' : ''}`} style={{ left: `${leftPct}%` }}>
                        {isEditing ? (
                          <input
                            autoFocus
                            value={edit.value}
                            onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                            onBlur={() => { onCommit(barIndex, beat, edit.value); setEdit(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { onCommit(barIndex, beat, edit.value); setEdit(null); }
                              if (e.key === 'Escape') setEdit(null);
                            }}
                            placeholder="Cm7"
                          />
                        ) : interactive ? (
                          <button
                            className="chordbtn"
                            onClick={() => {
                              onSelect(barIndex, slot?.id ?? null);
                              setEdit({ bar: barIndex, beat, value: slot?.input ?? '' });
                            }}
                            title={slot ? 'Edit chord' : 'Add chord'}
                          >
                            {slot ? prettyChord(slot.input) : '＋'}
                          </button>
                        ) : (
                          <span className="chordbtn">{slot ? prettyChord(slot.input) : ''}</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="beatdots">
                    {Array.from({ length: bpb }).map((_, b) => (
                      <i key={b} className={bar.slots.some((s) => s.beat === b) ? 'on' : ''} style={{ left: `calc(${(b / bpb) * 100}% + 1px)` }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="staff">
            {/* plain boxes, not a gradient or SVG: those lost hairlines when printed */}
            <div className="stafflines" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} style={{ top: 3 + i * 7 }} />
              ))}
            </div>
            <div className="bl" style={{ gridTemplateColumns: gridCols }}>
              <div />
              {sys.map((bar) => <div key={bar.id} className="blbar" />)}
            </div>
            <svg className="glyphs" width="100%" height="34" aria-hidden>
              {/* notation order: clef → key signature → time signature */}
              <text x="6" y="25">&#xE050;</text>
              {Array.from({ length: sig.count }).map((_, i) => {
                const step = sig.flats ? FLAT_STEPS[i] : SHARP_STEPS[i];
                const y = 4 + step * 3.5;
                return (
                  <text key={i} x={34 + i * 12} y={y} fontSize="28">
                    {sig.flats ? '\uE260' : '\uE262'}
                  </text>
                );
              })}
              {si === 0 && (
                <>
                  <text x={42 + sig.count * 12} y="11">&#xE084;</text>
                  <text x={42 + sig.count * 12} y="25">&#xE084;</text>
                </>
              )}
            </svg>
          </div>

          <div className="scrow" style={{ gridTemplateColumns: gridCols }}>
            <div />
            {sys.map((bar, bi) => {
              const barIndex = startBar + bi;
              return (
                <div className="scbar" key={bar.id}>
                  {bar.slots.map((slot) => {
                    const cands = suggestions.get(slot.id) ?? [];
                    const top = cands[0];
                    if (!top) return null;
                    const selected = interactive && (selection.slotId === slot.id || (selection.slotId === null && selection.bar === barIndex));
                    const idx = bar.slots.indexOf(slot);
                    const next = bar.slots[idx + 1];
                    const nextTop = next ? (suggestions.get(next.id) ?? [])[0] : null;
                    const smooth = nextTop ? transitions(top.pcs, nextTop.pcs) : null;
                    return (
                      <div
                        key={slot.id}
                        className={`scsub${selected ? ' sel' : ''}`}
                        style={{ left: `${(slot.beat / bpb) * 100}%`, width: `${(1 / bar.slots.length) * 100}%` }}
                        onClick={interactive ? () => onSelect(barIndex, slot.id) : undefined}
                        role={interactive ? 'button' : undefined}
                        tabIndex={interactive ? 0 : undefined}
                      >
                        <span className="nm" title={top.name}>{top.name}</span>
                        {top.added.length > 0 && <em>+{top.added.length}</em>}
                        <span className="alt">▸{cands.length - 1}</span>
                        {smooth !== null && (
                          <span className={`smooth${smooth < 0.75 ? ' shift' : ''}`} title="transition">{smooth < 0.75 ? '↗' : '→'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  }

  return (
    <section className="card leadsheet">
      <div className="print-head">
        <h2>{chart.name || autoName(chart)}</h2>
        <span>{keyInfo.name} · {chart.tempo} bpm · {styleLabel} · {chart.visibleBars} bars</span>
      </div>

      <div className="cardhead screen-only">
        <div className="ttl">Leadsheet</div>
        <div className="chip">{chart.name || autoName(chart)}</div>
        <div className="sub">Tap a beat to type a chord · drag the stave to set an A–B loop · {chart.visibleBars} bars</div>
        <div className="spacer" />
        <div className="chip"><span className="dot" />Bar {selection.bar + 1} selected</div>
        <div className="chip">{keyInfo.name}</div>
        <div className="stepper">
          <button onClick={() => onBarCount(chart.visibleBars - 1)} disabled={chart.visibleBars <= 4} aria-label="Fewer bars">−</button>
          <span>{chart.visibleBars} bars</span>
          <button onClick={() => onBarCount(chart.visibleBars + 1)} disabled={chart.visibleBars >= 32} aria-label="More bars">+</button>
        </div>
        <button className="chip btn" onClick={onToggleView}>{view === 'fit' ? 'Fit' : 'Comfort'}</button>
      </div>

      <div className={`chart screen-chart ${view}${drag ? ' dragging' : ''}`}>
        {renderChart(view === 'fit' ? 8 : 4, gutterFor(sig.count), true)}
      </div>

      <div className="summary">
        <span className="lead2">Whole progression</span>
        <span className="txt"><b>{keyInfo.name}</b> — {global[0]?.name ?? ''} across the chart.</span>
        <div className="spacer" />
        {global.slice(1, 3).map((g) => (
          <div className="chip" key={g.id}>{g.name}</div>
        ))}
      </div>
    </section>
  );
}
