import { useState } from 'react';
import type { Chart, Style } from '../chart/model';
import { ALL_KEYS } from '../theory/keys';
import { VERSION } from '../version';
import { VersionModal } from './VersionModal';

interface LoopState { mode: 'off' | 'visible' | 'range'; from: number; to: number }

interface Props {
  chart: Chart;
  keyName: string;
  confidence: number;
  playing: boolean;
  loop: LoopState;
  range: { from: number; to: number };
  onPlay: () => void;
  onStop: () => void;
  onLoopChange: (l: LoopState) => void;
  onTempo: (bpm: number) => void;
  onStyle: (s: Style) => void;
  onKeyChange: (value: string) => void;
  onPrint: () => void;
  actions: {
    resetFour: () => void;
    loadBlueBossa: () => void;
    clear: () => void;
    newChart: () => void;
    fit: () => void;
  };
}

const STYLE_LABEL: Record<Style, string> = {
  jazz: 'Jazz Swing',
  rock: 'Rock',
  bossa: 'Bossa Nova',
};

export function Header(props: Props) {
  const [menu, setMenu] = useState<'chart' | 'loop' | null>(null);
  const [history, setHistory] = useState(false);
  const { chart } = props;

  const currentKey = chart.keyManual
    ? `${chart.keyManual.tonic}|${chart.keyManual.mode}`
    : '';

  return (
    <header className="topbar">
      <div className="logo" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="3.2" height="20" rx="1.4" fill="#FCE9D3" />
          <path d="M9 1v20M16 1v20" stroke="#FCE9D3" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M7 7.5h11M7 14.5h11" stroke="#FCE9D3" strokeWidth="1.4" strokeLinecap="round" opacity=".75" />
        </svg>
      </div>
      <div className="brand">
        <h1>
          Guitar Solo Maestro
          <button className="verbtn" onClick={() => setHistory(true)} title="Version history">
            v{VERSION}
          </button>
        </h1>
        <p>made by <b>Ray Foo</b> &nbsp;·&nbsp; <a href="https://www.rayfooproductions.com" target="_blank" rel="noreferrer">www.rayfooproductions.com</a></p>
      </div>

      <div className="spacer" />

      <label className="ctl">
        <span className="lbl">Key</span>
        <select value={currentKey} onChange={(e) => props.onKeyChange(e.target.value)}>
          <option value="">{props.keyName} (auto {Math.round(props.confidence * 100)}%)</option>
          {ALL_KEYS.map((k) => (
            <option key={k.name} value={`${k.tonic}|${k.mode}`}>{k.name}</option>
          ))}
        </select>
      </label>

      <label className="ctl">
        <span className="lbl">Tempo</span>
        <input
          type="number"
          min={40}
          max={220}
          value={chart.tempo}
          onChange={(e) => props.onTempo(Math.max(40, Math.min(220, Number(e.target.value) || 120)))}
        />
      </label>

      <label className="ctl">
        <span className="lbl">Style</span>
        <select value={chart.style} onChange={(e) => props.onStyle(e.target.value as Style)}>
          {(['jazz', 'rock', 'bossa'] as Style[]).map((s) => (
            <option key={s} value={s}>{STYLE_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <div className="menu">
        <button className="ctl btn" onClick={() => setMenu(menu === 'chart' ? null : 'chart')}>Chart ▾</button>
        {menu === 'chart' && (
          <>
            <div className="backdrop" onClick={() => setMenu(null)} />
            <div className="dropdown">
              <button onClick={() => { props.actions.resetFour(); setMenu(null); }}>Reset to 4 bars</button>
              <button onClick={() => { props.actions.newChart(); setMenu(null); }}>New chart</button>
              <button onClick={() => { props.actions.loadBlueBossa(); setMenu(null); }}>Load Blue Bossa</button>
              <button onClick={() => { props.actions.clear(); setMenu(null); }}>Clear chords</button>
              <button onClick={() => { props.actions.fit(); setMenu(null); }}>Fit / Comfortable</button>
            </div>
          </>
        )}
      </div>

      <button className="btn-print" onClick={props.onPrint}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M4.5 5.5V1.8h7v3.7" strokeLinecap="round" />
          <rect x="1.6" y="5.5" width="12.8" height="6.2" rx="1.3" />
          <path d="M4.5 9.5h7v4.7h-7z" fill="currentColor" stroke="none" />
        </svg>
        Print
      </button>

      <div className="menu">
        <button
          className={`loopbtn ${props.loop.mode === 'range' ? 'on' : ''}`}
          onClick={() => setMenu(menu === 'loop' ? null : 'loop')}
        >
          ⟲ {props.loop.mode === 'range' ? `A–B ${props.range.from + 1}–${props.range.to + 1}` : props.loop.mode === 'off' ? 'Loop off' : 'Loop'}
          <span className="caret">▾</span>
        </button>
        {menu === 'loop' && (
          <>
            <div className="backdrop" onClick={() => setMenu(null)} />
            <div className="dropdown wide">
              <div className="grp">
                {(['off', 'visible', 'range'] as const).map((m) => (
                  <button
                    key={m}
                    className={props.loop.mode === m ? 'active' : ''}
                    onClick={() => props.onLoopChange({ ...props.loop, mode: m })}
                  >
                    {m === 'off' ? 'No loop' : m === 'visible' ? 'Loop visible bars' : 'Loop A–B range'}
                  </button>
                ))}
              </div>
              <div className="steppers">
                <label>A <button onClick={() => props.onLoopChange({ ...props.loop, mode: 'range', from: Math.max(1, props.loop.from - 1) })}>−</button><b>{props.loop.from}</b><button onClick={() => props.onLoopChange({ ...props.loop, mode: 'range', from: Math.min(32, props.loop.from + 1) })}>+</button></label>
                <label>B <button onClick={() => props.onLoopChange({ ...props.loop, mode: 'range', to: Math.max(1, props.loop.to - 1) })}>−</button><b>{props.loop.to}</b><button onClick={() => props.onLoopChange({ ...props.loop, mode: 'range', to: Math.min(32, props.loop.to + 1) })}>+</button></label>
              </div>
            </div>
          </>
        )}
      </div>

      <VersionModal open={history} onClose={() => setHistory(false)} />

      <button className={`btn-play${props.playing ? ' on' : ''}`} onClick={props.playing ? props.onStop : props.onPlay}>
        {props.playing ? (
          <>
            <svg width="9" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1.5" /></svg>
            Stop
          </>
        ) : (
          <>
            <svg width="9" height="11" viewBox="0 0 10 12" fill="currentColor"><path d="M1 1l8 5-8 5z" /></svg>
            Play
          </>
        )}
      </button>
    </header>
  );
}
