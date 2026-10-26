import { useState } from 'react';
import type { Candidate } from '../theory/suggest';
import { degreeOf, noteX, rowY, TUNING, STRING_NAMES, FRET_COUNT } from '../theory/fretboard';
import { midiToName } from '../theory/pitch';

interface Props {
  candidate: Candidate | null;
  chordPcs: number[];
  rootPc: number;
  flats: boolean;
  tensions: boolean;
  onToggleTensions: () => void;
  playingBar: number;
  playBeat: number;
}

const W = 1000;
const H = 186;
const NUT = 58;
const END = W - 12;

const POSITIONS = [
  { label: 'All', from: 0, to: 24 },
  { label: '1–5', from: 1, to: 5 },
  { label: '3–7', from: 3, to: 7 },
  { label: '5–9', from: 5, to: 9 },
  { label: '8–12', from: 8, to: 12 },
  { label: '10–15', from: 10, to: 15 },
  { label: '12–17', from: 12, to: 17 },
  { label: '17–24', from: 17, to: 24 },
];

export function Fretboard({ candidate, chordPcs, rootPc, flats, tensions, onToggleTensions }: Props) {
  const [mode, setMode] = useState<'degrees' | 'notes'>('degrees');
  const [pos, setPos] = useState(0);
  const scaleIntervals = candidate?.scale.intervals ?? [];
  const inScale = new Set(candidate?.pcs ?? []);
  const chordSet = new Set(chordPcs);

  const window = POSITIONS[pos];

  return (
    <section className="card board">
      <div className="boardhead">
        <div>
          <div className="ttl">Fretboard</div>
          <div className="sub">
            {candidate ? (
              <>
                <b>{candidate.name}</b> · {candidate.degrees} · tonic <b>{midiToName(60 + rootPc, flats).replace(/\d/g, '')}</b> ringed
              </>
            ) : (
              'Select a chord'
            )}
          </div>
        </div>
        <div className="spacer" />
        <div className="seg">
          <button className={mode === 'degrees' ? 'on' : ''} onClick={() => setMode('degrees')}>Degrees</button>
          <button className={mode === 'notes' ? 'on' : ''} onClick={() => setMode('notes')}>Notes</button>
        </div>
        <button className={`chip btn${tensions ? ' active' : ''}`} onClick={onToggleTensions}>
          <span className="dashdot" /> Tensions
        </button>
      </div>

      <div className="boardwrap">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" role="img" aria-label="Fretboard">
          <rect x="0" y="0" width={W} height={H} rx="9" fill="#FDFBF6" />
          <rect x="0.5" y="0.5" width={W - 1} height={168} rx="9" fill="none" stroke="#EFE9DC" />

          {[3, 5, 7, 9, 15, 17, 19, 21].map((f) => (
            <circle key={f} cx={noteX(f, NUT, END)} cy={(rowY(2) + rowY(3)) / 2} r={4} fill="#E7E0D0" />
          ))}
          {[12, 24].map((f) => (
            <g key={f}>
              <circle cx={noteX(f, NUT, END)} cy={(rowY(1) + rowY(2)) / 2} r={4} fill="#E7E0D0" />
              <circle cx={noteX(f, NUT, END)} cy={(rowY(3) + rowY(4)) / 2} r={4} fill="#E7E0D0" />
            </g>
          ))}

          {Array.from({ length: FRET_COUNT }).map((_, i) => {
            const f = i + 1;
            const x = noteX(f, NUT, END) + (noteX(f + 1, NUT, END) - noteX(f, NUT, END)) / 2;
            return (
              <line
                key={f}
                x1={x} y1={14} x2={x} y2={164}
                stroke={f === 12 ? '#B9AF9B' : '#D8D0BF'}
                strokeWidth={f === 12 ? 1.4 : 1}
                opacity={f >= window.from && f <= window.to ? 1 : 0.35}
              />
            );
          })}
          <rect x={NUT - 3} y={12} width={4} height={154} rx={1.6} fill="#1B1712" />

          {TUNING.map((open, si) => (
            <g key={si}>
              <line
                x1={NUT} y1={rowY(si)} x2={END} y2={rowY(si)}
                stroke="#C3BBAA" strokeWidth={2.2 - si * 0.22} strokeLinecap="round"
              />
              <text x={22} y={rowY(si) + 3} textAnchor="end" fontSize={8.5} fontWeight={600} fill="#A79E8C" fontFamily="ui-monospace, monospace">
                {STRING_NAMES[si]}
              </text>
            </g>
          ))}

          {Array.from({ length: FRET_COUNT }).map((_, i) => {
            const f = i + 1;
            return (
              <text key={f} x={noteX(f, NUT, END)} y={176} textAnchor="middle" fontSize={7.5} fill="#B3AA98" fontFamily="ui-monospace, monospace">
                {f}
              </text>
            );
          })}

          {TUNING.map((open, si) =>
            Array.from({ length: FRET_COUNT + 1 }).map((_, fret) => {
              const midi = open + fret;
              const pc = ((midi % 12) + 12) % 12;
              const x = noteX(fret, NUT, END);
              const y = rowY(si);
              const dim = fret >= window.from && fret <= window.to ? 1 : 0.25;

              if (!inScale.has(pc)) {
                if (!tensions) return null;
                return <circle key={`t${si}-${fret}`} cx={x} cy={y} r={4} fill="none" stroke="#CBC1AC" strokeWidth={0.9} strokeDasharray="2 2" opacity={dim} />;
              }

              const isTonic = pc === rootPc;
              const isChord = chordSet.has(pc);
              const rad = isTonic ? 10 : isChord ? 9 : 8;
              const label = mode === 'notes'
                ? midiToName(midi, flats)
                : degreeOf(pc, rootPc, scaleIntervals) ?? '';

              return (
                <g key={`${si}-${fret}`} opacity={dim}>
                  {isTonic && <circle cx={x} cy={y} r={rad + 3} fill="none" stroke="#C98136" strokeWidth={1.1} opacity={0.55} />}
                  <circle
                    cx={x} cy={y} r={rad}
                    fill={isTonic ? '#B45309' : isChord ? '#0F766E' : '#F2ECDD'}
                    stroke={isTonic || isChord ? '#FDFBF6' : '#DCD3BF'}
                    strokeWidth={isTonic ? 2.4 : isChord ? 2 : 0.9}
                  />
                  <text
                    x={x} y={y + 3} textAnchor="middle"
                    fontSize={label.length > 1 ? 6.8 : isTonic ? 8.6 : 7.8}
                    fontWeight={700}
                    fill={isTonic || isChord ? '#FFFFFF' : '#847B69'}
                  >
                    {label}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
      </div>

      <div className="foot">
        <span className="lab">Position</span>
        {POSITIONS.map((p, i) => (
          <button key={p.label} className={`pos${i === pos ? ' on' : ''}`} onClick={() => setPos(i)}>
            {p.label}
          </button>
        ))}
        <div className="spacer" />
        <div className="legend">
          <span><i className="sw tonic" />Tonic</span>
          <span><i className="sw chord" />Chord tones</span>
          <span><i className="sw scale" />Scale tones</span>
          <span><i className="sw tension" />Tension</span>
        </div>
      </div>
    </section>
  );
}
