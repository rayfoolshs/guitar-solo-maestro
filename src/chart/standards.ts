import { uid, type Bar, type Chart, type Style } from './model';

/**
 * A bundled standard from the Core 100 list.
 *
 * `changes` is a compact lead-sheet line: `|` separates bars and `,` puts two
 * chords in one bar (beats 1 and 3). Charts are chord symbols only — no melody
 * or lyrics — and are intended as practice aids.
 */
export interface Standard {
  rank: number;
  id: string;
  title: string;
  composer: string;
  year: number;
  style: Style;
  tempo: number;
  form: string;
  tags: string[];
  changes: string;
  /** True when the changes have been checked against a published lead sheet. */
  verified: boolean;
}

const splitBar = (bar: string): string[] =>
  bar.split(',').map((c) => c.trim()).filter(Boolean);

export function barsFromChanges(changes: string): Bar[] {
  return changes
    .split('|')
    .map((bar) => bar.trim())
    .filter(Boolean)
    .map((bar) => {
      const chords = splitBar(bar);
      const step = chords.length > 1 ? 4 / chords.length : 4;
      return {
        id: uid('b'),
        slots: chords.map((input, i) => ({
          id: uid('s'),
          beat: i === 0 ? 0 : Math.round(i * step * 100) / 100,
          input,
        })),
      };
    });
}

function swingFor(style: Style): number {
  if (style === 'shuffle') return 1;
  if (style === 'bossa' || style === 'rock' || style === 'funk') return 0;
  return 0.62;
}

export function standardToChart(s: Standard): Chart {
  const bars = barsFromChanges(s.changes);
  return {
    id: uid('c'),
    name: s.title,
    timeSignature: '4/4',
    bars,
    visibleBars: Math.min(64, Math.max(4, bars.length)),
    keyManual: null,
    tempo: s.tempo,
    style: s.style,
    swing: swingFor(s.style),
    countIn: true,
    metronome: false,
    pianoOctave: 0,
    pins: {},
    composer: s.composer,
    year: s.year,
    form: s.form,
    tags: s.tags,
  };
}

const std = (
  rank: number,
  id: string,
  title: string,
  composer: string,
  year: number,
  style: Style,
  tempo: number,
  form: string,
  tags: string[],
  verified: boolean,
  changes: string,
): Standard => ({ rank, id, title, composer, year, style, tempo, form, tags, changes, verified });

/**
 * Core 100 — a practice-oriented blend of the JazzStandards.com popularity
 * ranking and the Learn Jazz Standards jam-session list. Rank is our own
 * ordering; style is the default playback feel, tags describe the idiom.
 */
export const STANDARDS: Standard[] = [
  std(1, "body-and-soul", "Body and Soul", "Johnny Green", 1930, "ballad", 66, "AABA 32", ["ballad", "standard"], false,
    "Ebm7|Ab7|Dbmaj7|Dbmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Cm7b5|F7|Bbm7|Bbm7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7"),
  std(2, "all-the-things-you-are", "All the Things You Are", "Jerome Kern", 1939, "jazz", 152, "AABA 36", ["swing", "standard"], true,
    "Fm7|Bbm7|Eb7|Abmaj7|Dbmaj7|Dbm7|Cm7|Bdim7|Bbm7|Eb7|Abmaj7|Cm7,F7|Bbm7|Eb7|Abmaj7|Abmaj7|Dbmaj7|Dbm7|Cm7|F7|Bbm7|Eb7|Abmaj7|Abmaj7|Fm7|Bbm7|Eb7|Abmaj7|Dbmaj7|Dbm7|Cm7|Bdim7|Bbm7|Eb7|Abmaj7|Abmaj7"),
  std(3, "summertime", "Summertime", "George Gershwin", 1935, "ballad", 72, "16-bar", ["ballad", "minor"], false,
    "Am7|Am7|E7|E7|Am7|Am7|Dm7|Dm7|Am7|Am7|E7|E7|Am7|Dm7|Am7|E7"),
  std(4, "round-midnight", "'Round Midnight", "Thelonious Monk", 1944, "ballad", 60, "AABA 32", ["ballad", "minor"], false,
    "Ebm7|Ebm7|Bbm7|Bbm7|Ebm7|Ebm7|Ab7|Ab7|Ebm7|Ebm7|C7b9|C7b9|Fm7|Fm7|B7|Bb7|Ebm7|Ebm7|Bbm7|Bbm7|Ebm7|Ebm7|Ab7|Ab7|Ebm7|Ab7|Ebm7|Ebm7|Bbm7|Bb7|Ebm7|Ebm7"),
  std(5, "i-cant-get-started", "I Can't Get Started", "Vernon Duke", 1935, "ballad", 68, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Em7|A7|Dm7|G7|Cmaj7|Cmaj7|Fm7|Bb7|Em7|A7|Dm7|G7|Em7|A7|Dm7|G7|Cmaj7|A7|Dm7|G7|Cmaj7|Cmaj7|Fm7|Bb7|Em7|A7|Dm7|G7"),
  std(6, "my-funny-valentine", "My Funny Valentine", "Richard Rodgers", 1937, "ballad", 62, "AABA 32", ["ballad", "minor"], false,
    "Cm|Cm|Cm(maj7)|Cm7|Fm7|Fm7|Abmaj7|G7|Cm|Cm|Cm(maj7)|Cm7|Fm7|Fm7|G7|G7|Abmaj7|Abmaj7|Fm7|Fm7|Dm7b5|G7|Cm|Cm|Abmaj7|Fm7|Cm|Cm|Dm7b5|G7|Cm|Cm"),
  std(7, "lover-man", "Lover Man", "Jimmy Davis", 1942, "ballad", 66, "AABA 32", ["ballad"], false,
    "Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Gm7|C7"),
  std(8, "what-is-this-thing-called-love", "What Is This Thing Called Love?", "Cole Porter", 1930, "jazz", 176, "AABA 32", ["swing", "standard"], true,
    "Cm7|Cm7|F7|F7|Cm7|Cm7|F7|F7|Ab7|Ab7|G7|G7|Cm7|F7|Cm7|Cm7|Cm7|F7|Cm7|Cm7|F7|F7|Cm7|Cm7|Ab7|Ab7|G7|G7|Cm7|F7|Cm7|Cm7"),
  std(9, "yesterdays", "Yesterdays", "Jerome Kern", 1933, "ballad", 72, "AABA 32", ["ballad", "minor"], false,
    "Dm7|Dm7|Bbmaj7|Bbmaj7|A7|A7|Dm7|Dm7|Gm7|Gm7|Dm7|Dm7|E7|E7|A7|A7|Dm7|Dm7|Bbmaj7|Bbmaj7|A7|A7|Dm7|Dm7|Gm7|Gm7|Dm7|Dm7|A7|A7|Dm7|Dm7"),
  std(10, "stella-by-starlight", "Stella by Starlight", "Victor Young", 1946, "jazz", 138, "AABA 32", ["swing", "standard"], false,
    "Em7b5|A7b9|Cm7|F7|Fm7|Bb7|Ebmaj7|Ab7|Bbmaj7|Em7b5|A7b9|Dm7b5|G7|Cm7|F7|Bb|Em7b5|A7b9|Cm7|F7|Fm7|Bb7|Ebmaj7|Ab7|Bbmaj7|Em7b5|A7b9|Dm7b5|G7|Cm7|F7|Bb"),
  std(11, "autumn-leaves", "Autumn Leaves", "Joseph Kosma", 1947, "jazz", 132, "AABC 32", ["swing", "standard"], true,
    "Cm7|F7|Bbmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|Cm7|F7|Bbmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|Am7b5|D7|Gm7|Gm7|Cm7|F7|Bbmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|Cm7|F7|Bbmaj7|Ebmaj7"),
  std(12, "star-dust", "Star Dust", "Hoagy Carmichael", 1929, "ballad", 66, "AABA 32", ["ballad", "standard"], false,
    "Db|Ebm7|Ab7|Db|Gm7b5|C7|Fmaj7|Bb7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Bbm7|Eb7|Abmaj7|Ab7|Db|Ebm7|Ab7|Db|Gm7b5|C7|Fmaj7|Bb7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Bbm7|Eb7|Abmaj7|Db"),
  std(13, "willow-weep-for-me", "Willow Weep for Me", "Ann Ronell", 1932, "ballad", 66, "AABA 32", ["ballad"], false,
    "G|G|C7|C7|G|G|Bm7b5|E7|Am7|Am7|D7|D7|G|G|Bm7b5|E7|Am7|Am7|D7|D7|G|G|Bb7|Bb7|Am7|D7|G|G|Am7|D7|G|G"),
  std(14, "whats-new", "What's New?", "Bob Haggart", 1939, "ballad", 64, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Bm7b5|E7|Am7|Am7|D7|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|C7|Fmaj7|Fmaj7|Gm7|C7|Fmaj7|Fmaj7"),
  std(15, "honeysuckle-rose", "Honeysuckle Rose", "Fats Waller", 1929, "jazz", 160, "AABA 32", ["swing", "standard"], true,
    "F7|F7|Bb7|Bb7|F7|F7|D7|D7|G7|G7|C7|C7|F7|F7|Bb7|Bb7|F7|F7|F7|F7|Bb7|Bb7|Bb7|Bb7|F7|F7|D7|G7|F7|Bb7|F7|C7"),
  std(16, "sweet-georgia-brown", "Sweet Georgia Brown", "Ben Bernie", 1925, "jazz", 168, "AABA 32", ["swing", "dixieland"], true,
    "Ab|Ab|Eb7|Eb7|Ab|Ab|Db7|Db7|Ab|F7|Bb7|Bb7|Eb7|Eb7|Ab|Eb7|Ab|Ab|Eb7|Eb7|Ab|Ab|Db7|Db7|Ab|F7|Bb7|Bb7|Ab|Eb7|Ab|Ab"),
  std(17, "caravan", "Caravan", "Juan Tizol", 1936, "jazz", 148, "AABA 32", ["latin", "swing"], false,
    "Fm7|Fm7|Fm7|Fm7|Bb7|Bb7|Fm7|Fm7|Db7|Db7|Fm7|Fm7|C7|C7|Fm7|C7|Fm7|Fm7|Bb7|Bb7|Fm7|Fm7|Db7|Db7|Fm7|Fm7|C7|C7|Fm7|C7|Fm7|Fm7"),
  std(18, "the-man-i-love", "The Man I Love", "George Gershwin", 1924, "ballad", 68, "AABA 32", ["ballad"], false,
    "Eb|Eb|Cm7|Cm7|Fm7|Bb7|Eb|Eb|Ab|Ab|Fm7|Bb7|Eb|Cm7|Fm7|Bb7|Eb|Eb|Cm7|Cm7|Fm7|Bb7|Eb|Eb|Ab|Ab|Gm7|C7|Fm7|Bb7|Eb|Bb7"),
  std(19, "in-a-sentimental-mood", "In a Sentimental Mood", "Duke Ellington", 1935, "ballad", 64, "AABA 32", ["ballad", "minor"], false,
    "Fm7|Fm7|Dbmaj7|Dbmaj7|Gm7b5|C7|Fm7|Fm7|Bbm7|Bbm7|Ebm7|Ab7|Dbmaj7|Dbmaj7|C7|C7|Fm7|Fm7|Dbmaj7|Dbmaj7|Gm7b5|C7|Fm7|Fm7|Bbm7|Bbm7|Ebm7|Ab7|Dbmaj7|C7|Fm7|Fm7"),
  std(20, "st-louis-blues", "St. Louis Blues", "W.C. Handy", 1914, "shuffle", 120, "16-bar blues", ["blues"], true,
    "G7|G7|G7|G7|C7|C7|G7|G7|D7|C7|G7|D7|G7|C7|G7|D7"),
  std(21, "how-high-the-moon", "How High the Moon", "Morgan Lewis", 1940, "jazz", 184, "AABA 32", ["swing", "standard"], false,
    "Gmaj7|Gmaj7|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gmaj7|Gm7|C7|Bm7b5,E7|Am7|D7|Gmaj7|G7|Cmaj7|F7|Bm7b5|E7|Am7|D7|Gmaj7|E7|Am7|D7|G|G"),
  std(22, "oh-lady-be-good", "Oh, Lady Be Good!", "George Gershwin", 1924, "jazz", 176, "AABA 32", ["swing", "standard"], false,
    "G6|G6|G6|G6|C7|C7|G6|G6|D7|D7|Am7|D7|G6|G6|G6|D7|G6|G6|G6|G6|C7|C7|G6|G6|A7|A7|D7|D7|G6|G6|G6|G6"),
  std(23, "take-the-a-train", "Take the \"A\" Train", "Billy Strayhorn", 1941, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "Cmaj7|Cmaj7|D7|D7|Dm7|G7|Cmaj7|Cmaj7|Cmaj7|D7|Dm7|G7|Cmaj7|Cmaj7|D7|D7|Dm7|G7|Cmaj7|Cmaj7|Fmaj7|Fmaj7|D7|D7|Dm7|G7|Cmaj7|Cmaj7|Dm7|G7|Cmaj7|Cmaj7"),
  std(24, "embraceable-you", "Embraceable You", "George Gershwin", 1930, "ballad", 68, "AABA 32", ["ballad"], false,
    "G|G|G|Bbdim7|Am7|D7|G|G|G|G|G|Bbdim7|Am7|D7|G|G|C|C|Cm|Cm|G|G|A7|A7|D7|D7|G|G|Am7|D7|G|G"),
  std(25, "on-green-dolphin-street", "On Green Dolphin Street", "Bronisław Kaper", 1947, "bossa", 140, "ABAC 32", ["latin", "standard"], false,
    "Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(26, "tenderly", "Tenderly", "Walter Gross", 1946, "ballad", 62, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Bbm7|Eb7|Abmaj7|Abmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fm7|Fm7|Bb7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(27, "the-way-you-look-tonight", "The Way You Look Tonight", "Jerome Kern", 1936, "jazz", 156, "AABA 32", ["swing", "standard"], true,
    "F|F|Fm|Bb7|Eb|Eb|Cm7|F7|Bbmaj7|Bbmaj7|Gm7|C7|F|F|Gm7|C7|F|F|Fm|Bb7|Eb|Eb|Cm7|F7|Bbmaj7|Bbmaj7|Gm7|C7|F|F|F|F"),
  std(28, "these-foolish-things", "These Foolish Things", "Jack Strachey", 1936, "ballad", 64, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(29, "ill-remember-april", "I'll Remember April", "Gene de Paul", 1941, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "G|G|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|G|G|Am7|D7|G|G|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|G|G|G|G"),
  std(30, "love-for-sale", "Love for Sale", "Cole Porter", 1930, "bossa", 136, "AABA 32", ["latin", "standard"], false,
    "Bbm7|Bbm7|Eb7|Eb7|Bbm7|Bbm7|Eb7|Eb7|Bbmaj7|Bbmaj7|Gm7|C7|Cm7|F7|Bbmaj7|Bbmaj7|Bbm7|Bbm7|Eb7|Eb7|Bbm7|Bbm7|Eb7|Eb7|Bbmaj7|Bbmaj7|Gm7|C7|Cm7|F7|Bbmaj7|Bbmaj7"),
  std(31, "sophisticated-lady", "Sophisticated Lady", "Duke Ellington", 1933, "ballad", 62, "AABA 32", ["ballad"], false,
    "Ab|Ab|C7|C7|Fm7|Fm7|Bb7|Bb7|Eb7|Eb7|Ab|Ab|F7|F7|Bbm7|Eb7|Ab|Ab|C7|C7|Fm7|Fm7|Bb7|Bb7|Eb7|Eb7|Ab|Ab|Bbm7|Eb7|Ab|Ab"),
  std(32, "aint-misbehavin", "Ain't Misbehavin'", "Fats Waller", 1929, "jazz", 152, "AABA 32", ["swing", "standard"], false,
    "C|C|E7|E7|F|F|C|C|C7|C7|F|F|D7|D7|G7|G7|C|E7|F|F|C|A7|D7|G7|C|E7|F|F|C|G7|C|C"),
  std(33, "night-and-day", "Night and Day", "Cole Porter", 1932, "jazz", 160, "AABA 32", ["swing", "standard"], false,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Am7|D7|Gmaj7|Gmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Am7|D7|Gmaj7|Gmaj7|Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gmaj7|Gmaj7|Am7|D7|Gmaj7|Gmaj7|Gmaj7|Gmaj7"),
  std(34, "after-youve-gone", "After You've Gone", "Turner Layton", 1918, "jazz", 176, "AABA 32", ["swing", "dixieland"], true,
    "G|G|G7|G7|C|C|C7|C7|G|G|E7|E7|A7|A7|D7|D7|G|G|G7|G7|C|C|C7|C7|G|E7|A7|D7|G|D7|G|G"),
  std(35, "laura", "Laura", "David Raksin", 1945, "ballad", 60, "AABA 32", ["ballad"], true,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(36, "lush-life", "Lush Life", "Billy Strayhorn", 1949, "ballad", 58, "through-composed 32", ["ballad"], false,
    "Dbmaj7|Dbmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Cm7b5|F7|Bbm7|Bbm7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dbmaj7|Dbmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(37, "sweet-lorraine", "Sweet Lorraine", "Cliff Burwell", 1928, "jazz", 160, "AABA 32", ["swing", "dixieland"], true,
    "G|G|G|G|C7|C7|G|G|A7|A7|D7|D7|G|G|D7|D7|G|G|G|G|C7|C7|G|G|E7|E7|A7|D7|G|D7|G|G"),
  std(38, "dont-blame-me", "Don't Blame Me", "Jimmy McHugh", 1932, "ballad", 64, "AABA 32", ["ballad"], false,
    "C|C|C7|C7|F|F|Fm|Fm|C|C|A7|A7|D7|D7|G7|G7|C|C|C7|C7|F|F|Fm|Fm|C|A7|D7|G7|C|G7|C|C"),
  std(39, "cherokee", "Cherokee", "Ray Noble", 1938, "jazz", 240, "AABA 64", ["bebop", "swing"], true,
    "Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Dm7|G7|Cm7|F7|Bbmaj7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Dm7|G7|Cm7|F7|Bbmaj7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Cm7|F7|Bbmaj7|Bbmaj7"),
  std(40, "night-in-tunisia", "Night in Tunisia", "Dizzy Gillespie", 1942, "bossa", 152, "AABA 32", ["latin", "bebop"], false,
    "Dm7|Dm7|Ebm7|Ebm7|Dm7|Dm7|Ebm7|Ebm7|Dm7|Dm7|Ebm7|Ebm7|Dm7|Dm7|Ebm7|Ebm7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Em7b5|A7b9|Dm7|Dm7|Em7b5|A7b9|Dm7|Dm7"),
  std(41, "indiana", "Indiana", "James F. Hanley", 1917, "jazz", 180, "AABA 32", ["swing", "standard"], true,
    "F|F|F7|F7|Bb|Bb|Bb7|Bb7|F|F|D7|D7|G7|G7|C7|C7|F|F|F7|F7|Bb|Bb|Bb7|Bb7|F|D7|G7|C7|F|C7|F|F"),
  std(42, "you-go-to-my-head", "You Go to My Head", "J. Fred Coots", 1938, "ballad", 64, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(43, "there-will-never-be-another-you", "There Will Never Be Another You", "Harry Warren", 1942, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "Ebmaj7|Ebmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|Cm7|F7|Fm7|Bb7|Ebmaj7|Ebmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7"),
  std(44, "georgia-on-my-mind", "Georgia on My Mind", "Hoagy Carmichael", 1930, "ballad", 68, "AABA 32", ["ballad"], false,
    "Fmaj7|Fmaj7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Dm7|Dm7|Gm7|Gm7|C7|C7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Am7|D7|Gm7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7"),
  std(45, "satin-doll", "Satin Doll", "Duke Ellington", 1953, "jazz", 144, "AABA 32", ["swing", "standard"], true,
    "Cmaj7|Cmaj7|Dm7|G7|Cmaj7|Cmaj7|Dm7|G7|Em7|A7|Em7|A7|Dm7|G7|Dm7|G7|Cmaj7|Cmaj7|Dm7|G7|Cmaj7|Cmaj7|Dm7|G7|Em7|A7|Em7|A7|Dm7|G7|C|C"),
  std(46, "prelude-to-a-kiss", "Prelude to a Kiss", "Duke Ellington", 1938, "ballad", 62, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|C7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fm7|Bb7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(47, "i-should-care", "I Should Care", "Axel Stordahl", 1944, "ballad", 66, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(48, "stompin-at-the-savoy", "Stompin' at the Savoy", "Edgar Sampson", 1934, "jazz", 160, "AABA 32", ["swing", "standard"], true,
    "Db|Db|F7|F7|Bbm7|Bbm7|Eb7|Eb7|Ab|Ab|Ab7|Ab7|Db|Db|Db|Db|Db|Db|F7|F7|Bbm7|Bbm7|Eb7|Eb7|Ab|Ab|Ab7|Ab7|Db|Ab7|Db|Db"),
  std(49, "how-deep-is-the-ocean", "How Deep Is the Ocean?", "Irving Berlin", 1932, "ballad", 64, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Fm7|Fm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Fm7|Fm7|Bb7|Bb7|Abmaj7|Abmaj7|Abmaj7|Abmaj7|Fm7|Fm7|Bb7|Bb7|Ebmaj7|Ebmaj7|Cm7|F7|Fm7|Bb7|Eb|Eb"),
  std(50, "i-cover-the-waterfront", "I Cover the Waterfront", "Johnny Green", 1933, "ballad", 62, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(51, "come-rain-or-come-shine", "Come Rain or Come Shine", "Harold Arlen", 1946, "ballad", 66, "AABA 32", ["ballad"], false,
    "Fmaj7|Fmaj7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7"),
  std(52, "there-is-no-greater-love", "There Is No Greater Love", "Isham Jones", 1936, "jazz", 152, "AABA 32", ["swing", "standard"], true,
    "Bbmaj7|Bbmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Dm7|G7|Cm7|Cm7|F7|F7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Dm7|G7|Cm7|Cm7|F7|F7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7"),
  std(53, "you-dont-know-what-love-is", "You Don't Know What Love Is", "Gene de Paul", 1941, "ballad", 60, "AABA 32", ["ballad", "minor"], false,
    "Gm7|Gm7|Gm7|Gm7|Cm7|Cm7|Cm7|Cm7|Gm7|Gm7|Gm7|Gm7|Am7b5|D7|Gm7|Gm7|Gm7|Gm7|Gm7|Gm7|Cm7|Cm7|Cm7|Cm7|Gm7|Gm7|Am7b5|D7|Gm7|Gm7|Gm7|Gm7"),
  std(54, "but-not-for-me", "But Not for Me", "George Gershwin", 1930, "jazz", 152, "AABA 32", ["swing", "standard"], true,
    "Ebmaj7|Ebmaj7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(55, "on-the-sunny-side-of-the-street", "On the Sunny Side of the Street", "Jimmy McHugh", 1930, "jazz", 152, "AABA 32", ["swing", "standard"], true,
    "C|C|C|C|F|F|C|C|C7|C7|F|F|C|C|C|C|D7|D7|G7|G7|C|C|A7|A7|D7|D7|G7|G7|C|G7|C|C"),
  std(56, "misty", "Misty", "Erroll Garner", 1954, "ballad", 66, "AABA 32", ["ballad", "standard"], true,
    "Ebmaj7|Bbm7,Eb7|Abmaj7|Abm7,Db7|Ebmaj7,Cm7|Fm7,Bb7|Gm7,C7|Fm7,Bb7|Ebmaj7|Bbm7,Eb7|Abmaj7|Abm7,Db7|Ebmaj7,Cm7|Fm7,Bb7|Gm7,C7|Fm7,Bb7|Bbm7|Eb7|Abmaj7|Abmaj7|Am7|D7|Gm7|C7|Ebmaj7|Bbm7,Eb7|Abmaj7|Abm7,Db7|Ebmaj7,Cm7|Fm7,Bb7|Ebmaj7|Ebmaj7"),
  std(57, "love-is-here-to-stay", "Love Is Here to Stay", "George Gershwin", 1938, "jazz", 144, "AABA 32", ["swing", "standard"], false,
    "G|G|G|G|Am7|D7|G|G|G|G|G|G|Am7|D7|G|G|C|C|C|C|Cm|Cm|G|G|A7|A7|D7|D7|G|G|G|G"),
  std(58, "perdido", "Perdido", "Juan Tizol", 1942, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "Bbmaj7|Bbmaj7|Bbm7|Eb7|Abmaj7|Abmaj7|Abm7|Db7|Gbmaj7|Gbmaj7|Gm7|C7|Cm7|F7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbm7|Eb7|Abmaj7|Abmaj7|Abm7|Db7|Gbmaj7|Gbmaj7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7"),
  std(59, "tea-for-two", "Tea for Two", "Vincent Youmans", 1924, "jazz", 172, "AABA 32", ["swing", "standard"], true,
    "Ab|Ab|Ab|Ab|Db|Db|Ab|Ab|Eb7|Eb7|Ab|Ab|Ab|Ab|Ab|Ab|Db|Db|Ab|Ab|F7|F7|Bb7|Bb7|Ab|Db|Ab|Eb7|Ab|Eb7|Ab|Ab"),
  std(60, "it-could-happen-to-you", "It Could Happen to You", "Jimmy Van Heusen", 1944, "jazz", 156, "AABA 32", ["swing", "standard"], true,
    "Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(61, "i-got-it-bad", "I Got It Bad", "Duke Ellington", 1941, "ballad", 64, "AABA 32", ["ballad"], false,
    "Ab|Ab|Ab|Ab|Bb7|Bb7|Ab|Ab|F7|F7|Bb7|Bb7|Eb7|Eb7|Ab|Ab|Ab|Ab|Ab|Ab|Bb7|Bb7|Ab|Ab|F7|F7|Bb7|Bb7|Eb7|Eb7|Ab|Ab"),
  std(62, "skylark", "Skylark", "Hoagy Carmichael", 1941, "ballad", 62, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Bb7"),
  std(63, "over-the-rainbow", "Over the Rainbow", "Harold Arlen", 1938, "ballad", 62, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Ebmaj7|Ebmaj7|Cm7|F7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(64, "the-nearness-of-you", "The Nearness of You", "Hoagy Carmichael", 1937, "ballad", 60, "AABA 32", ["ballad"], false,
    "Fmaj7|Fmaj7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Fmaj7|Fmaj7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Am7|D7|Gm7|C7|Fmaj7|Fmaj7"),
  std(65, "if-i-had-you", "If I Had You", "Jimmy Campbell", 1928, "ballad", 66, "AABA 32", ["ballad"], false,
    "C|C|C|C|Cm7|F7|Bb|Bb|Bbm7|Eb7|Ab|Ab|Abm7|Db7|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Eb|Eb|Am7b5|D7|Gm7|Gm7|C7|C7|F|F|F|F"),
  std(66, "ghost-of-a-chance", "Ghost of a Chance", "Victor Young", 1932, "ballad", 64, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7|D7|Gmaj7|Gmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Em7b5|A7b9|Dm7|G7|C|C"),
  std(67, "angel-eyes", "Angel Eyes", "Matt Dennis", 1946, "ballad", 58, "AABA 32", ["ballad", "minor"], false,
    "Cm|Cm|Cm|Cm|Fm7|Fm7|Bb7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fm7|Fm7|Bb7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|C7|Fm7|Bb7|Eb|Eb|Eb|Eb"),
  std(68, "out-of-nowhere", "Out of Nowhere", "Johnny Green", 1931, "jazz", 156, "AABA 32", ["swing", "standard"], true,
    "Gmaj7|Gmaj7|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gmaj7|Gmaj7|Gmaj7|Gmaj7|Bm7b5|E7|Am7|D7|Gmaj7|Gmaj7|Bm7b5|E7|Am7|D7|Gmaj7|Gmaj7|Gmaj7|Gmaj7|Gmaj7|Gmaj7"),
  std(69, "lover-come-back-to-me", "Lover Come Back to Me", "Sigmund Romberg", 1928, "jazz", 176, "AABA 32", ["swing", "standard"], true,
    "Ab|Ab|Ab|Ab|F7|F7|Bb7|Bb7|Ab|Ab|G7|G7|C7|C7|F7|F7|Bb7|Bb7|Bb7|Bb7|Eb7|Eb7|Ab|Ab|F7|F7|Bb7|Eb7|Ab|Ab|Ab|Ab"),
  std(70, "darn-that-dream", "Darn That Dream", "Jimmy Van Heusen", 1939, "ballad", 62, "AABA 32", ["ballad"], false,
    "Gmaj7|Gmaj7|Gm7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gmaj7|Gmaj7|Gmaj7|Gmaj7|Am7|D7|Gmaj7|Gmaj7|Am7|D7|Gmaj7|Gmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Gmaj7|Gmaj7|Gmaj7|Gmaj7"),
  std(71, "all-of-me", "All of Me", "Gerald Marks", 1931, "jazz", 156, "AABA 32", ["swing", "standard"], true,
    "C|C|E7|E7|A7|A7|Dm7|Dm7|E7|E7|A7|A7|Dm7|Dm7|G7|G7|C|C|E7|E7|A7|A7|Dm7|Dm7|Fm7|Bb7|Em7|A7|Dm7|G7|C|C"),
  std(72, "more-than-you-know", "More Than You Know", "Vincent Youmans", 1929, "ballad", 64, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Abmaj7|Abmaj7|Fm7|Fm7|Bb7|Bb7|Ebmaj7|Ebmaj7|Cm7|F7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(73, "i-got-rhythm", "I Got Rhythm", "George Gershwin", 1930, "jazz", 200, "AABA 32", ["rhythm-changes", "bebop"], true,
    "Bb,G7|Cm7,F7|Bb,G7|Cm7,F7|Fm7,Bb7|Eb,Ebm|Bb,G7|Cm7,F7|Bb,G7|Cm7,F7|Bb,G7|Cm7,F7|Fm7,Bb7|Eb,Ebm|Bb,G7|Cm7,F7|D7|D7|G7|G7|C7|C7|F7|F7|Bb,G7|Cm7,F7|Bb,G7|Cm7,F7|F7|F7|Bb|Bb"),
  std(74, "just-one-of-those-things", "Just One of Those Things", "Cole Porter", 1935, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "C|C|C|C|Cm7|F7|Bb|Bb|Bbm7|Eb7|Ab|Ab|Am7b5|D7|G7|G7|C|C|C|C|Cm7|F7|Bb|Bb|Bbm7|Eb7|Ab|Ab|Dm7|G7|C|C"),
  std(75, "mean-to-me", "Mean to Me", "Fred Ahlert", 1929, "ballad", 66, "AABA 32", ["ballad"], false,
    "C|C|C7|C7|F|F|Fm|Fm|C|C|A7|A7|D7|D7|G7|G7|C|C|C7|C7|F|F|Fm|Fm|C|A7|D7|G7|C|G7|C|C"),
  std(76, "september-song", "September Song", "Kurt Weill", 1938, "ballad", 62, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(77, "someone-to-watch-over-me", "Someone to Watch Over Me", "George Gershwin", 1926, "ballad", 64, "AABA 32", ["ballad"], false,
    "Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Gm7|C7|Fm7|Fm7|Bb7|Bb7|Ebmaj7|Ebmaj7|Cm7|F7|Fm7|Bb7|Ebmaj7|Ebmaj7"),
  std(78, "ive-found-a-new-baby", "I've Found a New Baby", "Spencer Williams", 1926, "jazz", 176, "AABA 32", ["swing", "dixieland"], true,
    "F|F|F7|F7|Bb|Bb|Bb7|Bb7|F|F|D7|D7|Gm7|C7|F|C7|F|F|F7|F7|Bb|Bb|Bb7|Bb7|F|D7|Gm7|C7|F|C7|F|F"),
  std(79, "polka-dots-and-moonbeams", "Polka Dots and Moonbeams", "Jimmy Van Heusen", 1940, "ballad", 62, "AABA 32", ["ballad"], false,
    "Fmaj7|Fmaj7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Fmaj7|Fmaj7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Bbm7|Eb7|Fmaj7|Fmaj7|Fmaj7|Fmaj7"),
  std(80, "easy-living", "Easy Living", "Ralph Rainger", 1937, "ballad", 64, "AABA 32", ["ballad"], true,
    "Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7"),
  std(81, "pennies-from-heaven", "Pennies from Heaven", "Arthur Johnston", 1936, "jazz", 152, "AABA 32", ["swing", "standard"], true,
    "C|C|C|C|C7|C7|F|F|Fm|Fm|C|C|D7|D7|G7|G7|C|C|C|C|C7|C7|F|F|Fm|Fm|C|A7|D7|G7|C|C"),
  std(82, "i-didnt-know-what-time-it-was", "I Didn't Know What Time It Was", "Richard Rodgers", 1939, "jazz", 152, "AABA 32", ["swing", "standard"], true,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(83, "memories-of-you", "Memories of You", "Eubie Blake", 1930, "ballad", 64, "AABA 32", ["ballad"], true,
    "Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(84, "it-dont-mean-a-thing", "It Don't Mean a Thing", "Duke Ellington", 1932, "jazz", 180, "AABA 32", ["swing", "standard"], true,
    "Bb|Bb|Bb|Bb|F7|F7|Bb|Bb|Bb7|Bb7|Eb|Eb|F7|F7|Bb|Bb|Bb|Bb|Bb|Bb|F7|F7|Bb|Bb|D7|D7|G7|G7|Cm7|F7|Bb|Bb"),
  std(85, "just-friends", "Just Friends", "John Klenner", 1931, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Am7|D7|Gm7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7"),
  std(86, "they-cant-take-that-away-from-me", "They Can't Take That Away from Me", "George Gershwin", 1937, "jazz", 152, "AABA 32", ["swing", "standard"], true,
    "Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(87, "star-eyes", "Star Eyes", "Gene de Paul", 1943, "bossa", 144, "AABA 32", ["latin", "standard"], false,
    "Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebm7|Ab7|Dbmaj7|Dbmaj7|Dm7b5|G7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7"),
  std(88, "a-foggy-day", "A Foggy Day", "George Gershwin", 1937, "jazz", 156, "AABA 32", ["swing", "standard"], true,
    "Fmaj7|Fmaj7|Fmaj7|Fmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7|Fmaj7"),
  std(89, "alone-together", "Alone Together", "Arthur Schwartz", 1932, "ballad", 66, "AABA 32", ["ballad"], true,
    "Dm7|Dm7|Dm7|Dm7|Gm7|Gm7|Gm7|Gm7|Em7b5|A7b9|Dm7|Dm7|Em7b5|A7b9|Dm7|Dm7|Bbmaj7|Bbmaj7|Bbmaj7|Bbmaj7|Em7b5|A7b9|Dm7|Dm7|Em7b5|A7b9|Dm7|Dm7|Dm7|Dm7|Dm7|Dm7"),
  std(90, "just-you-just-me", "Just You, Just Me", "Jesse Greer", 1929, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "C|C|C|C|C7|C7|F|F|Fm|Fm|C|C|D7|D7|G7|G7|C|C|C|C|C7|C7|F|F|Fm|Fm|C|A7|D7|G7|C|C"),
  std(91, "my-romance", "My Romance", "Richard Rodgers", 1935, "ballad", 64, "AABA 32", ["ballad"], false,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(92, "things-aint-what-they-used-to-be", "Things Ain't What They Used to Be", "Mercer Ellington", 1942, "shuffle", 128, "12-bar blues", ["blues"], true,
    "Bb7|Bb7|Bb7|Bb7|Eb7|Eb7|Bb7|Bb7|F7|Eb7|Bb7|F7"),
  std(93, "do-nothin-till-you-hear-from-me", "Do Nothin' Till You Hear from Me", "Duke Ellington", 1943, "ballad", 68, "AABA 32", ["ballad"], true,
    "Ab|Ab|Ab|Ab|Bb7|Bb7|Ab|Ab|F7|F7|Bb7|Bb7|Eb7|Eb7|Ab|Ab|Ab|Ab|Ab|Ab|Bb7|Bb7|Ab|Ab|F7|F7|Bb7|Bb7|Eb7|Eb7|Ab|Ab"),
  std(94, "blue-moon", "Blue Moon", "Richard Rodgers", 1934, "ballad", 66, "AABA 32", ["ballad"], true,
    "Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(95, "i-surrender-dear", "I Surrender Dear", "Harry Barris", 1931, "ballad", 64, "AABA 32", ["ballad"], true,
    "C|C|C|C|Cm7|F7|Bb|Bb|Bbm7|Eb7|Ab|Ab|Am7b5|D7|G7|G7|C|C|C|C|Cm7|F7|Bb|Bb|Bbm7|Eb7|Ab|Ab|Dm7|G7|C|C"),
  std(96, "you-stepped-out-of-a-dream", "You Stepped Out of a Dream", "Nacio Herb Brown", 1940, "jazz", 160, "AABA 32", ["swing", "standard"], true,
    "Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(97, "my-one-and-only-love", "My One and Only Love", "Guy Wood", 1953, "ballad", 62, "AABA 32", ["ballad"], true,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
  std(98, "s-wonderful", "'S Wonderful", "George Gershwin", 1927, "jazz", 168, "AABA 32", ["swing", "standard"], true,
    "Ebmaj7|Ebmaj7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Gm7|C7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(99, "smoke-gets-in-your-eyes", "Smoke Gets in Your Eyes", "Jerome Kern", 1933, "ballad", 62, "AABA 32", ["ballad"], true,
    "Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Cm7|Cm7|Fm7|Bb7|Ebmaj7|Ebmaj7|Abmaj7|Abmaj7|Gm7|C7|Fm7|Bb7|Eb|Eb"),
  std(100, "heres-that-rainy-day", "Here's That Rainy Day", "Jimmy Van Heusen", 1953, "ballad", 60, "AABA 32", ["ballad"], true,
    "Cmaj7|Cmaj7|Cm7|F7|Bbmaj7|Bbmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Fm7|Bb7|Ebmaj7|Ebmaj7|Am7b5|D7|Gm7|Gm7|C7|C7|Fmaj7|Fmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7|Cmaj7"),
];

export const STANDARD_TAGS: string[] = [...new Set(STANDARDS.flatMap((s) => s.tags))].sort();

export const findStandard = (id: string): Standard | undefined => STANDARDS.find((s) => s.id === id);
