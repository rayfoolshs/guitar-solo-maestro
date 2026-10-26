import type { Chart, Style } from '../chart/model';
import type { Position } from '../audio/engine';
import type { LoadProgress } from '../audio/soundfont';

interface Props {
  chart: Chart;
  playing: boolean;
  position: Position;
  volumes: { piano: number; bass: number; drums: number };
  mutes: { piano: boolean; bass: boolean; drums: boolean };
  onVolume: (ch: 'piano' | 'bass' | 'drums', db: number) => void;
  onMute: (ch: 'piano' | 'bass' | 'drums', muted: boolean) => void;
  onSwing: (v: number) => void;
  onTempo: (v: number) => void;
  onStyle: (s: Style) => void;
  onPlay: () => void;
  onStop: () => void;
  range: { from: number; to: number };
  loop: { mode: string };
  bank: LoadProgress;
  pianoOctave: number;
  onPianoOctave: (v: number) => void;
}

const CHANNELS = [
  { id: 'piano' as const, name: 'Piano', glyph: '♬' },
  { id: 'bass' as const, name: 'Bass', glyph: '𝄢' },
  { id: 'drums' as const, name: 'Drums', glyph: '◍' },
];

function bankLabel(b: LoadProgress): string {
  if (b.phase === 'ready') return 'GM';
  if (b.phase === 'download') {
    const pct = b.total ? Math.round((b.loaded / b.total) * 100) : 0;
    return pct ? `${pct}%` : '…';
  }
  if (b.phase === 'bank') return '…';
  if (b.phase === 'error') return 'Synth';
  return 'Synth';
}

export function Mixer(props: Props) {
  const { chart } = props;
  const bar = props.position.playing ? props.position.bar + 1 : props.range.from + 1;

  return (
    <section className="card mixer">
      <div className="mixhead">
        <div className="ttl">Mixer</div>
        <span className={`bankchip ${props.bank.phase}`}>{bankLabel(props.bank)}</span>
        <div className="spacer" />
        <span className="sub">{props.playing ? `bar ${bar}` : `${chart.tempo} bpm`}</span>
      </div>

      <div className="transport">
        <button className="tp primary wide" onClick={props.playing ? props.onStop : props.onPlay}>
          {props.playing ? '■ Stop' : '▶ Play'}
        </button>
        <div className="tempoline">
          <button className="tp sq" onClick={() => props.onTempo(Math.max(40, chart.tempo - 5))}>−</button>
          <span className="bpm">{chart.tempo}</span>
          <button className="tp sq" onClick={() => props.onTempo(Math.min(220, chart.tempo + 5))}>+</button>
        </div>
      </div>
      <select className="tp sel full" value={chart.style} onChange={(e) => props.onStyle(e.target.value as Style)}>
        <option value="jazz">Jazz Swing</option>
        <option value="rock">Rock</option>
        <option value="bossa">Bossa Nova</option>
      </select>

      <div className="channels">
        {CHANNELS.map((ch) => (
          <div className="ch" key={ch.id}>
            <div className="chrow">
              <span className="ico">{ch.glyph}</span>
              <span className="cname">{ch.name}</span>
              <span className="spacer" />
              <span className="db">{props.volumes[ch.id] <= -60 ? '−∞' : `${props.volumes[ch.id]}`}</span>
              <button
                className={`mt${props.mutes[ch.id] ? ' on' : ''}`}
                onClick={() => props.onMute(ch.id, !props.mutes[ch.id])}
                title="Mute"
              >
                M
              </button>
            </div>
            <div className="chrow">
              <input
                className="slider"
                type="range"
                min={-60}
                max={6}
                step={1}
                value={props.volumes[ch.id]}
                onChange={(e) => props.onVolume(ch.id, Number(e.target.value))}
                aria-label={`${ch.name} volume`}
              />
              {ch.id === 'piano' && (
                <span className="oct" title="Shift the piano voicing by an octave">
                  <span className="tag">oct</span>
                  <button onClick={() => props.onPianoOctave(props.pianoOctave - 1)} disabled={props.pianoOctave <= -2}>−</button>
                  <b>{props.pianoOctave > 0 ? `+${props.pianoOctave}` : props.pianoOctave}</b>
                  <button onClick={() => props.onPianoOctave(props.pianoOctave + 1)} disabled={props.pianoOctave >= 2}>+</button>
                </span>
              )}
            </div>
          </div>
        ))}

        <div className={`swingrow${chart.style !== 'jazz' ? ' disabled' : ''}`}>
          <span className="lbl">Swing</span>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(chart.swing * 100)}
            disabled={chart.style !== 'jazz'}
            onChange={(e) => props.onSwing(Number(e.target.value) / 100)}
            aria-label="Swing strength"
          />
          <span className="db">{chart.style === 'jazz' ? `${Math.round(chart.swing * 100)}%` : '—'}</span>
        </div>
      </div>
    </section>
  );
}
