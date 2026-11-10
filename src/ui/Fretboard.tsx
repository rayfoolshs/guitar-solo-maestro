import { useCallback, useEffect, useRef, useState } from 'react';
import type { Candidate } from '../theory/suggest';
import { degreeOf, noteX, rowY, TUNING, STRING_NAMES, FRET_COUNT } from '../theory/fretboard';
import { midiToName } from '../theory/pitch';
import { engine } from '../audio/engine';
import { midiInput, programOf, type MidiInputStatus, type MidiInstrumentId } from '../audio/midiInput';
import { midiForKey } from '../audio/computerKeys';
import { Keyboard } from './Keyboard';
import { MidiBar } from './MidiBar';

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

function Legend() {
  return (
    <div className="legend">
      <span><i className="sw tonic" />Tonic</span>
      <span><i className="sw chord" />Chord tones</span>
      <span><i className="sw scale" />Scale tones</span>
      <span><i className="sw tension" />Tension</span>
    </div>
  );
}

export function Fretboard({ candidate, chordPcs, rootPc, flats, tensions, onToggleTensions }: Props) {
  const [mode, setMode] = useState<'degrees' | 'notes'>('degrees');
  const [pos, setPos] = useState(0);
  const [view, setView] = useState<'fretboard' | 'keyboard'>('fretboard');
  const [midi, setMidi] = useState<MidiInputStatus>(() => midiInput.getStatus());
  const [instrument, setInstrument] = useState<MidiInstrumentId>('piano');
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const held = useRef<Set<number>>(new Set());
  const scaleIntervals = candidate?.scale.intervals ?? [];
  const inScale = new Set(candidate?.pcs ?? []);
  const chordSet = new Set(chordPcs);

  useEffect(() => midiInput.subscribe(setMidi), []);

  const pressNote = useCallback((midi: number, velocity = 100) => {
    if (held.current.has(midi)) return;
    held.current.add(midi);
    engine.playNoteOn(midi, velocity, programOf(instrument));
    setActiveNotes((prev) => new Set(prev).add(midi));
  }, [instrument]);

  const releaseNote = useCallback((midi: number) => {
    if (!held.current.delete(midi)) return;
    engine.noteOff(midi);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  const releaseAll = useCallback(() => {
    held.current.forEach((midi) => engine.noteOff(midi));
    held.current.clear();
    setActiveNotes(new Set());
  }, []);

  useEffect(() => {
    if (!midi.enabled) return;
    return midiInput.onNote((note) => {
      if (note.allOff) {
        releaseAll();
        return;
      }
      if (note.on) pressNote(note.midi, note.velocity);
      else releaseNote(note.midi);
    });
  }, [midi.enabled, pressNote, releaseNote, releaseAll]);

  // Computer-keyboard fallback while the keyboard view is open: A–K plays C4–C5.
  useEffect(() => {
    if (view !== 'keyboard') return;
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const midi = midiForKey(e.key);
      if (midi === null) return;
      e.preventDefault();
      pressNote(midi);
    };
    const up = (e: KeyboardEvent) => {
      const midi = midiForKey(e.key);
      if (midi !== null) releaseNote(midi);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      releaseAll();
    };
  }, [view, pressNote, releaseNote, releaseAll]);

  const toggleMidi = () => {
    if (midi.enabled) {
      releaseAll();
      midiInput.disable();
    } else {
      void engine.prepareSoundfont();
      void midiInput.enable();
    }
  };

  const fretWindow = POSITIONS[pos];

  return (
    <section className="card board">
      <div className="boardhead">
        <div>
          <div className="ttl">{view === 'fretboard' ? 'Fretboard' : 'Keyboard'}</div>
          <div className="sub">
            {candidate ? (
              <>
                <b>{candidate.name}</b> · {candidate.degrees} ·{' '}
                {view === 'fretboard' ? (
                  <>tonic <b>{midiToName(60 + rootPc, flats).replace(/\d/g, '')}</b> ringed</>
                ) : (
                  <>right-hand fingering</>
                )}
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
        <button
          className={`kswitch${view === 'keyboard' ? ' on' : ''}`}
          role="switch"
          aria-checked={view === 'keyboard'}
          onClick={() => setView((v) => (v === 'fretboard' ? 'keyboard' : 'fretboard'))}
        >
          <span className="track"><i /></span>
          Keyboard
        </button>
      </div>

      {view === 'keyboard' ? (
        <>
          <MidiBar
            status={midi}
            instrument={instrument}
            onToggle={toggleMidi}
            onSelectDevice={(id) => midiInput.select(id)}
            onSelectInstrument={setInstrument}
          />
          <Keyboard
            candidate={candidate}
            chordPcs={chordPcs}
            rootPc={rootPc}
            flats={flats}
            tensions={tensions}
            mode={mode}
            activeNotes={activeNotes}
            onNoteOn={pressNote}
            onNoteOff={releaseNote}
          />
          <div className="foot">
            <div className="spacer" />
            <Legend />
          </div>
        </>
      ) : (
        <>
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
                    opacity={f >= fretWindow.from && f <= fretWindow.to ? 1 : 0.35}
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
                  const dim = fret >= fretWindow.from && fret <= fretWindow.to ? 1 : 0.25;

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
            <Legend />
          </div>
        </>
      )}
    </section>
  );
}
