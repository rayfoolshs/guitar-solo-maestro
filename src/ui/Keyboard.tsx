import type { Candidate } from '../theory/suggest';
import {
  buildScaleNotesSpan, keyboardLayout, notationStart,
  type ScaleNote,
} from '../theory/keyboard';
import { degreeOf } from '../theory/fretboard';
import { mod12, pcName } from '../theory/pitch';

interface Props {
  candidate: Candidate | null;
  chordPcs: number[];
  rootPc: number;
  flats: boolean;
  tensions: boolean;
  mode: 'degrees' | 'notes';
  activeNotes?: Set<number>;
  onNoteOn?: (midi: number, velocity?: number) => void;
  onNoteOff?: (midi: number) => void;
}

const W = 1000;
const OCTAVES = 3;

/* ---- grand staff ---- */
const STAFF_X = 104;
const STAFF_END = 976;
const LINE_SPACE = 12;
const HALF_STEP = LINE_SPACE / 2;
const TREBLE_TOP = 72;
const TREBLE_BOTTOM = TREBLE_TOP + LINE_SPACE * 4;
const BASS_TOP = 178;
const BASS_BOTTOM = BASS_TOP + LINE_SPACE * 4;
const NOTE_LEFT = 196;
const NOTE_RIGHT = 962;
const STAFF_H = 284;
const DEGREE_Y = 24;
const FINGER_Y = BASS_BOTTOM + 26;
/** Bravura clefs: G clef is ~1.76 em tall, F clef ~0.90 em. */
const CLEF_X = 112;
const TREBLE_CLEF_SIZE = 48;
const BASS_CLEF_SIZE = 59;
const TREBLE_CLEF_Y = TREBLE_BOTTOM - LINE_SPACE; // G line
const BASS_CLEF_Y = BASS_TOP + LINE_SPACE;        // F line

/**
 * Grand staff: treble clef E4 (step 30) sits on its bottom line, bass clef G2
 * (step 18) on its bottom line. Middle C and everything above it go on the
 * treble staff (C4 on one ledger line below), everything below on the bass.
 */
const onTreble = (step: number) => step >= 28;
const noteY = (step: number) => onTreble(step)
  ? TREBLE_BOTTOM - (step - 30) * HALF_STEP
  : BASS_BOTTOM - (step - 18) * HALF_STEP;

/** Stems point away from the middle line of whichever staff holds the note. */
const stemUp = (step: number) => onTreble(step) ? step < 34 : step < 22;

/** Ledger lines a note needs, as diatonic steps. */
function ledgersFor(step: number): number[] {
  if (onTreble(step)) {
    const out: number[] = [];
    if (step <= 28) out.push(28);
    for (let s = 40; s <= step; s += 2) out.push(s);
    return out;
  }
  const out: number[] = [];
  for (let s = 16; s >= step; s -= 2) out.push(s);
  for (let s = 28; s <= step; s += 2) out.push(s);
  return out;
}

/* ---- keyboard ---- */
const KEY_TOP = 22;
const WHITE_H = 130;
const BLACK_H = 82;
const BOARD_H = KEY_TOP + WHITE_H + 8;

const TONIC = '#B45309';
const CHORD = '#0F766E';
const SAND = '#F2ECDD';
const BLACK_SCALE = '#6B6355';
/** Highlight for a scale note the player is currently holding. */
const PLAYED = '#B03A2E';
const PLAYED_SOFT = '#FBE9E7';

const octaveOf = (midi: number) => Math.floor(midi / 12) - 1;

/**
 * SMuFL accidental glyphs, plus the baseline nudge that centres each shape on
 * the notehead. A font-size of four staff spaces is the engraved norm.
 */
function accidentalGlyph(acc: number): { glyph: string; dy: number } | null {
  if (acc === -1) return { glyph: '\uE260', dy: 6.5 };
  if (acc <= -2) return { glyph: '\uE264', dy: 4 };
  if (acc === 1) return { glyph: '\uE262', dy: 0.5 };
  if (acc >= 2) return { glyph: '\uE263', dy: 3 };
  return null;
}

function Stave({ notes, activeNotes }: { notes: ScaleNote[]; activeNotes?: Set<number> }) {
  const gap = notes.length > 1 ? (NOTE_RIGHT - NOTE_LEFT) / (notes.length - 1) : 0;
  // Match by pitch class so a note played in any octave lights the staff note.
  const activePcs = new Set(activeNotes ? [...activeNotes].map((m) => mod12(m)) : []);

  return (
    <svg viewBox={`0 0 ${W} ${STAFF_H}`} width="100%" preserveAspectRatio="none" role="img"
      aria-label="Grand staff with treble and bass clefs, three octaves of the suggested scale, with right-hand fingering">
      <rect x="0" y="0" width={W} height={STAFF_H} rx="9" fill="#FDFBF6" />
      <rect x="0.5" y="0.5" width={W - 1} height={STAFF_H - 1} rx="9" fill="none" stroke="#EFE9DC" />

      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`treble-${i}`} x1={STAFF_X} y1={TREBLE_TOP + i * LINE_SPACE}
          x2={STAFF_END} y2={TREBLE_TOP + i * LINE_SPACE} stroke="#D8D0BF" strokeWidth={1} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`bass-${i}`} x1={STAFF_X} y1={BASS_TOP + i * LINE_SPACE}
          x2={STAFF_END} y2={BASS_TOP + i * LINE_SPACE} stroke="#D8D0BF" strokeWidth={1} />
      ))}

      <text x={CLEF_X} y={TREBLE_CLEF_Y} fontFamily="'Bravura', serif"
        fontSize={TREBLE_CLEF_SIZE} fill="#14120F">
        {'\uE050'}
      </text>
      <text x={CLEF_X} y={BASS_CLEF_Y} fontFamily="'Bravura', serif"
        fontSize={BASS_CLEF_SIZE} fill="#14120F">
        {'\uE062'}
      </text>

      {/* Bravura's brace glyph, stretched to span both staves. */}
      <g transform={`translate(${STAFF_X - 18} ${BASS_BOTTOM}) scale(1.9 1)`}>
        <text x="0" y="0" fontFamily="'Bravura', serif" fontSize={BASS_BOTTOM - TREBLE_TOP}
          fill="#14120F" stroke="#14120F" strokeWidth={0.4}>
          {'\uE000'}
        </text>
      </g>

      {notes.map((n, i) => {
        const x = NOTE_LEFT + i * gap;
        const y = noteY(n.step);
        const up = stemUp(n.step);
        const active = activePcs.has(n.pc);
        const ledgers = ledgersFor(n.step);
        const acc = accidentalGlyph(n.acc);

        return (
          <g key={`${n.midi}-${i}`}>
            {ledgers.map((s) => (
              <line key={s} x1={x - 13} y1={noteY(s)} x2={x + 13} y2={noteY(s)}
                stroke={active ? PLAYED : '#B9AF9B'} strokeWidth={1} />
            ))}

            <text x={x} y={DEGREE_Y} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={active ? PLAYED : '#A2906B'}>
              {n.degree}
            </text>

            {acc && (
              <text x={x - 16} y={y + acc.dy} textAnchor="middle" fontFamily="'Bravura', serif"
                fontSize={LINE_SPACE * 4} fill={active ? PLAYED : '#14120F'}>
                {acc.glyph}
              </text>
            )}

            <ellipse cx={x} cy={y} rx={7.3} ry={5.7} fill={active ? PLAYED : '#14120F'} transform={`rotate(-20 ${x} ${y})`} />
            <line
              x1={up ? x + 6.2 : x - 6.2} y1={y}
              x2={up ? x + 6.2 : x - 6.2} y2={up ? y - 34 : y + 34}
              stroke={active ? PLAYED : '#14120F'} strokeWidth={1.5} strokeLinecap="round"
            />

            <circle cx={x} cy={FINGER_Y} r={9} fill={active ? PLAYED_SOFT : '#FBF0E1'} stroke={active ? PLAYED : '#E3B27C'} strokeWidth={1} />
            <text x={x} y={FINGER_Y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={active ? PLAYED : '#8A3E07'}>
              {n.finger}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Keyboard({ candidate, chordPcs, rootPc, flats, tensions, mode, activeNotes, onNoteOn, onNoteOff }: Props) {
  if (!candidate) {
    return <div className="boardwrap kbempty">Select a chord to see its scale on the keyboard.</div>;
  }

  const notes = buildScaleNotesSpan(candidate.rootPc, candidate.scale, flats, OCTAVES);
  const inScale = new Set(candidate.pcs);
  const chordSet = new Set(chordPcs);
  const start = notationStart(candidate.rootPc);
  const layout = keyboardLayout(start - 12, OCTAVES, W);

  const fingerByMidi = new Map(notes.map((n) => [n.midi, n.finger]));
  const range = `${pcName(layout.low, flats)}${octaveOf(layout.low)}–${pcName(layout.high, flats)}${octaveOf(layout.high)}`;

  const paint = (midi: number, black: boolean) => {
    const pc = mod12(midi);
    if (!inScale.has(pc)) return black ? '#1B1712' : '#FFFFFF';
    if (pc === rootPc) return TONIC;
    if (chordSet.has(pc)) return CHORD;
    return black ? BLACK_SCALE : SAND;
  };

  const ink = (midi: number, black: boolean) => {
    const pc = mod12(midi);
    if (!inScale.has(pc)) return black ? '#8B8477' : '#B3AA98';
    if (pc === rootPc || chordSet.has(pc)) return '#FFFFFF';
    return black ? '#F6F2E8' : '#847B69';
  };

  const label = (midi: number) => {
    const pc = mod12(midi);
    if (mode === 'notes') return pcName(pc, flats);
    return degreeOf(pc, rootPc, candidate.scale.intervals) ?? '';
  };

  return (
    <div className="boardwrap kbwrap">
      <Stave notes={notes} activeNotes={activeNotes} />

      <svg viewBox={`0 0 ${W} ${BOARD_H}`} width="100%" preserveAspectRatio="none" role="img"
        aria-label={`Keyboard, ${range}, with the suggested scale highlighted`}>
        <rect x="0" y="0" width={W} height={BOARD_H} rx="9" fill="#FDFBF6" />
        <rect x="0.5" y="0.5" width={W - 1} height={BOARD_H - 1} rx="9" fill="none" stroke="#EFE9DC" />

        {layout.whites.map((key) => {
          const marked = inScale.has(mod12(key.midi));
          const finger = fingerByMidi.get(key.midi);
          const active = activeNotes?.has(key.midi) ?? false;
          return (
            <g
              key={`w${key.midi}`}
              style={{ cursor: 'pointer' }}
              onPointerDown={(e) => { e.preventDefault(); onNoteOn?.(key.midi); }}
              onPointerUp={() => onNoteOff?.(key.midi)}
              onPointerLeave={() => onNoteOff?.(key.midi)}
              onPointerCancel={() => onNoteOff?.(key.midi)}
            >
              <rect x={key.x + 1} y={KEY_TOP} width={key.w - 2} height={WHITE_H} rx={3}
                fill={paint(key.midi, false)} stroke="#DCD3BF" strokeWidth={0.9} />
              {active && (
                <rect x={key.x + 2} y={KEY_TOP + 2} width={key.w - 4} height={WHITE_H - 4} rx={2}
                  fill="none" stroke="#B45309" strokeWidth={2.6} />
              )}
              {marked ? (
                <>
                  <text x={key.x + key.w / 2} y={KEY_TOP + WHITE_H - 40} textAnchor="middle" fontSize={11}
                    fontWeight={700} fill={ink(key.midi, false)}>
                    {label(key.midi)}
                  </text>
                  {finger !== undefined && (
                    <>
                      <circle cx={key.x + key.w / 2} cy={KEY_TOP + WHITE_H - 15} r={8.5}
                        fill="#FBF0E1" stroke="#E3B27C" strokeWidth={1} />
                      <text x={key.x + key.w / 2} y={KEY_TOP + WHITE_H - 11.5} textAnchor="middle"
                        fontSize={9.5} fontWeight={700} fill="#8A3E07">
                        {finger}
                      </text>
                    </>
                  )}
                </>
              ) : tensions ? (
                <circle cx={key.x + key.w / 2} cy={KEY_TOP + WHITE_H - 15} r={3.4}
                  fill="none" stroke="#CBC1AC" strokeWidth={0.9} strokeDasharray="2 2" />
              ) : null}
            </g>
          );
        })}

        {layout.blacks.map((key) => {
          const marked = inScale.has(mod12(key.midi));
          const finger = fingerByMidi.get(key.midi);
          const active = activeNotes?.has(key.midi) ?? false;
          return (
            <g
              key={`b${key.midi}`}
              style={{ cursor: 'pointer' }}
              onPointerDown={(e) => { e.preventDefault(); onNoteOn?.(key.midi); }}
              onPointerUp={() => onNoteOff?.(key.midi)}
              onPointerLeave={() => onNoteOff?.(key.midi)}
              onPointerCancel={() => onNoteOff?.(key.midi)}
            >
              <rect x={key.x} y={KEY_TOP} width={key.w} height={BLACK_H} rx={2.5}
                fill={paint(key.midi, true)} stroke="#1B1712" strokeWidth={0.8} />
              {active && (
                <rect x={key.x + 1.5} y={KEY_TOP + 1.5} width={key.w - 3} height={BLACK_H - 3} rx={1.5}
                  fill="none" stroke="#F0B24A" strokeWidth={2.4} />
              )}
              {marked && (
                <text x={key.x + key.w / 2} y={KEY_TOP + BLACK_H - 26} textAnchor="middle" fontSize={9}
                  fontWeight={700} fill={ink(key.midi, true)}>
                  {label(key.midi)}
                </text>
              )}
              {marked && finger !== undefined && (
                <>
                  <circle cx={key.x + key.w / 2} cy={KEY_TOP + BLACK_H - 11} r={7.5}
                    fill="#FBF0E1" stroke="#E3B27C" strokeWidth={1} />
                  <text x={key.x + key.w / 2} y={KEY_TOP + BLACK_H - 8} textAnchor="middle"
                    fontSize={8.5} fontWeight={700} fill="#8A3E07">
                    {finger}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div className="kbstrip">
        <span className="lab">Right hand</span>
        {notes.map((n) => (
          <div className="kbnote" key={`${n.midi}-${n.finger}`}>
            <span className="fin">{n.finger}</span>
            <b>{n.name}</b>
            <em>{n.degree}</em>
          </div>
        ))}
        <div className="spacer" />
        <span className="kbrange">{range} · {OCTAVES} octaves</span>
      </div>
    </div>
  );
}
