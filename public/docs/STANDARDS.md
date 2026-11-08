# Core 100 standards

The app ships a bundled, searchable library of 100 jazz standards. It is a
practice-oriented blend of the JazzStandards.com popularity ranking and the Learn Jazz
Standards jam-session list — our own curation, not a copy of either ranking.

- Open from the **Standards** button in the header or `Chart ▾ → Core 100 standards…`.
- Search by title, composer or year.
- Filter by playback style: **All / Swing / Ballad / Blues / Latin**.
- Filter by idiom tag: **swing, ballad, bebop, latin, blues, standard**.
- Click a row to load it: playback stops and the chart opens on bar 1 with its own tempo,
  style and swing.

## What each entry contains

```ts
interface Standard {
  rank: number;
  id: string;
  title: string;
  composer: string;
  year: number;
  style: Style;       // default playback feel
  tempo: number;
  form: string;       // e.g. "AABA 32", "12-bar blues"
  tags: string[];
  changes: string;    // compact lead-sheet line
  verified: boolean;  // checked against a published reference
}
```

`changes` uses `|` between bars and `,` for two chords in one bar (beats 1 and 3):

```
Ebmaj7|Bbm7,Eb7|Abmaj7|Abm7,Db7|Ebmaj7,Cm7|Fm7,Bb7|Gm7,C7|Fm7,Bb7
```

`standardToChart()` converts an entry into a `Chart` with the right tempo, style, swing,
metadata and bar count. Long forms work: the bar cap is 64, so Cherokee (64 bars) and
All the Things You Are (36 bars) load in full.

## Style distribution

| Style | Count |
|---|---|
| Jazz Ballad | 51 |
| Jazz Swing | 43 |
| Latin / Bossa Nova | 4 |
| Blues Shuffle | 2 |

The historical popularity ranking is ballad-heavy and pre-1960, so the library has no
funk, rock or waltz entries. The tags (bebop, latin, blues, standard) give a finer split
than the playback style.

## Verified status

**49** entries are marked verified; **51** are flagged with a small amber dot in the list.
Verified means the changes have been checked against a commonly used published lead sheet.
Unverified charts are still playable but should be checked against your own reference
before a gig.

## Legal note

The charts contain **chord symbols only** — no melody, lyrics or publisher arrangement.
Many are still in copyright. They are practice aids; verify rights before redistributing
the dataset. For a legally safer default set, see the public-domain discussion in
`UPDATES.md`.

## All 100

| # | Title | Composer | Year | Style | Form | ✓ |
|---|---|---|---|---|---|---|
| 1 | Body and Soul | Johnny Green | 1930 | Jazz Ballad | AABA 32 |  |
| 2 | All the Things You Are | Jerome Kern | 1939 | Jazz Swing | AABA 36 | ✓ |
| 3 | Summertime | George Gershwin | 1935 | Jazz Ballad | 16-bar |  |
| 4 | 'Round Midnight | Thelonious Monk | 1944 | Jazz Ballad | AABA 32 |  |
| 5 | I Can't Get Started | Vernon Duke | 1935 | Jazz Ballad | AABA 32 |  |
| 6 | My Funny Valentine | Richard Rodgers | 1937 | Jazz Ballad | AABA 32 |  |
| 7 | Lover Man | Jimmy Davis | 1942 | Jazz Ballad | AABA 32 |  |
| 8 | What Is This Thing Called Love? | Cole Porter | 1930 | Jazz Swing | AABA 32 | ✓ |
| 9 | Yesterdays | Jerome Kern | 1933 | Jazz Ballad | AABA 32 |  |
| 10 | Stella by Starlight | Victor Young | 1946 | Jazz Swing | AABA 32 |  |
| 11 | Autumn Leaves | Joseph Kosma | 1947 | Jazz Swing | AABC 32 | ✓ |
| 12 | Star Dust | Hoagy Carmichael | 1929 | Jazz Ballad | AABA 32 |  |
| 13 | Willow Weep for Me | Ann Ronell | 1932 | Jazz Ballad | AABA 32 |  |
| 14 | What's New? | Bob Haggart | 1939 | Jazz Ballad | AABA 32 |  |
| 15 | Honeysuckle Rose | Fats Waller | 1929 | Jazz Swing | AABA 32 | ✓ |
| 16 | Sweet Georgia Brown | Ben Bernie | 1925 | Jazz Swing | AABA 32 | ✓ |
| 17 | Caravan | Juan Tizol | 1936 | Jazz Swing | AABA 32 |  |
| 18 | The Man I Love | George Gershwin | 1924 | Jazz Ballad | AABA 32 |  |
| 19 | In a Sentimental Mood | Duke Ellington | 1935 | Jazz Ballad | AABA 32 |  |
| 20 | St. Louis Blues | W.C. Handy | 1914 | Blues Shuffle | 16-bar blues | ✓ |
| 21 | How High the Moon | Morgan Lewis | 1940 | Jazz Swing | AABA 32 |  |
| 22 | Oh, Lady Be Good! | George Gershwin | 1924 | Jazz Swing | AABA 32 |  |
| 23 | Take the "A" Train | Billy Strayhorn | 1941 | Jazz Swing | AABA 32 | ✓ |
| 24 | Embraceable You | George Gershwin | 1930 | Jazz Ballad | AABA 32 |  |
| 25 | On Green Dolphin Street | Bronisław Kaper | 1947 | Bossa Nova | ABAC 32 |  |
| 26 | Tenderly | Walter Gross | 1946 | Jazz Ballad | AABA 32 |  |
| 27 | The Way You Look Tonight | Jerome Kern | 1936 | Jazz Swing | AABA 32 | ✓ |
| 28 | These Foolish Things | Jack Strachey | 1936 | Jazz Ballad | AABA 32 |  |
| 29 | I'll Remember April | Gene de Paul | 1941 | Jazz Swing | AABA 32 | ✓ |
| 30 | Love for Sale | Cole Porter | 1930 | Bossa Nova | AABA 32 |  |
| 31 | Sophisticated Lady | Duke Ellington | 1933 | Jazz Ballad | AABA 32 |  |
| 32 | Ain't Misbehavin' | Fats Waller | 1929 | Jazz Swing | AABA 32 |  |
| 33 | Night and Day | Cole Porter | 1932 | Jazz Swing | AABA 32 |  |
| 34 | After You've Gone | Turner Layton | 1918 | Jazz Swing | AABA 32 | ✓ |
| 35 | Laura | David Raksin | 1945 | Jazz Ballad | AABA 32 | ✓ |
| 36 | Lush Life | Billy Strayhorn | 1949 | Jazz Ballad | through-composed 32 |  |
| 37 | Sweet Lorraine | Cliff Burwell | 1928 | Jazz Swing | AABA 32 | ✓ |
| 38 | Don't Blame Me | Jimmy McHugh | 1932 | Jazz Ballad | AABA 32 |  |
| 39 | Cherokee | Ray Noble | 1938 | Jazz Swing | AABA 64 | ✓ |
| 40 | Night in Tunisia | Dizzy Gillespie | 1942 | Bossa Nova | AABA 32 |  |
| 41 | Indiana | James F. Hanley | 1917 | Jazz Swing | AABA 32 | ✓ |
| 42 | You Go to My Head | J. Fred Coots | 1938 | Jazz Ballad | AABA 32 |  |
| 43 | There Will Never Be Another You | Harry Warren | 1942 | Jazz Swing | AABA 32 | ✓ |
| 44 | Georgia on My Mind | Hoagy Carmichael | 1930 | Jazz Ballad | AABA 32 |  |
| 45 | Satin Doll | Duke Ellington | 1953 | Jazz Swing | AABA 32 | ✓ |
| 46 | Prelude to a Kiss | Duke Ellington | 1938 | Jazz Ballad | AABA 32 |  |
| 47 | I Should Care | Axel Stordahl | 1944 | Jazz Ballad | AABA 32 |  |
| 48 | Stompin' at the Savoy | Edgar Sampson | 1934 | Jazz Swing | AABA 32 | ✓ |
| 49 | How Deep Is the Ocean? | Irving Berlin | 1932 | Jazz Ballad | AABA 32 |  |
| 50 | I Cover the Waterfront | Johnny Green | 1933 | Jazz Ballad | AABA 32 |  |
| 51 | Come Rain or Come Shine | Harold Arlen | 1946 | Jazz Ballad | AABA 32 |  |
| 52 | There Is No Greater Love | Isham Jones | 1936 | Jazz Swing | AABA 32 | ✓ |
| 53 | You Don't Know What Love Is | Gene de Paul | 1941 | Jazz Ballad | AABA 32 |  |
| 54 | But Not for Me | George Gershwin | 1930 | Jazz Swing | AABA 32 | ✓ |
| 55 | On the Sunny Side of the Street | Jimmy McHugh | 1930 | Jazz Swing | AABA 32 | ✓ |
| 56 | Misty | Erroll Garner | 1954 | Jazz Ballad | AABA 32 | ✓ |
| 57 | Love Is Here to Stay | George Gershwin | 1938 | Jazz Swing | AABA 32 |  |
| 58 | Perdido | Juan Tizol | 1942 | Jazz Swing | AABA 32 | ✓ |
| 59 | Tea for Two | Vincent Youmans | 1924 | Jazz Swing | AABA 32 | ✓ |
| 60 | It Could Happen to You | Jimmy Van Heusen | 1944 | Jazz Swing | AABA 32 | ✓ |
| 61 | I Got It Bad | Duke Ellington | 1941 | Jazz Ballad | AABA 32 |  |
| 62 | Skylark | Hoagy Carmichael | 1941 | Jazz Ballad | AABA 32 |  |
| 63 | Over the Rainbow | Harold Arlen | 1938 | Jazz Ballad | AABA 32 |  |
| 64 | The Nearness of You | Hoagy Carmichael | 1937 | Jazz Ballad | AABA 32 |  |
| 65 | If I Had You | Jimmy Campbell | 1928 | Jazz Ballad | AABA 32 |  |
| 66 | Ghost of a Chance | Victor Young | 1932 | Jazz Ballad | AABA 32 |  |
| 67 | Angel Eyes | Matt Dennis | 1946 | Jazz Ballad | AABA 32 |  |
| 68 | Out of Nowhere | Johnny Green | 1931 | Jazz Swing | AABA 32 | ✓ |
| 69 | Lover Come Back to Me | Sigmund Romberg | 1928 | Jazz Swing | AABA 32 | ✓ |
| 70 | Darn That Dream | Jimmy Van Heusen | 1939 | Jazz Ballad | AABA 32 |  |
| 71 | All of Me | Gerald Marks | 1931 | Jazz Swing | AABA 32 | ✓ |
| 72 | More Than You Know | Vincent Youmans | 1929 | Jazz Ballad | AABA 32 |  |
| 73 | I Got Rhythm | George Gershwin | 1930 | Jazz Swing | AABA 32 | ✓ |
| 74 | Just One of Those Things | Cole Porter | 1935 | Jazz Swing | AABA 32 | ✓ |
| 75 | Mean to Me | Fred Ahlert | 1929 | Jazz Ballad | AABA 32 |  |
| 76 | September Song | Kurt Weill | 1938 | Jazz Ballad | AABA 32 |  |
| 77 | Someone to Watch Over Me | George Gershwin | 1926 | Jazz Ballad | AABA 32 |  |
| 78 | I've Found a New Baby | Spencer Williams | 1926 | Jazz Swing | AABA 32 | ✓ |
| 79 | Polka Dots and Moonbeams | Jimmy Van Heusen | 1940 | Jazz Ballad | AABA 32 |  |
| 80 | Easy Living | Ralph Rainger | 1937 | Jazz Ballad | AABA 32 | ✓ |
| 81 | Pennies from Heaven | Arthur Johnston | 1936 | Jazz Swing | AABA 32 | ✓ |
| 82 | I Didn't Know What Time It Was | Richard Rodgers | 1939 | Jazz Swing | AABA 32 | ✓ |
| 83 | Memories of You | Eubie Blake | 1930 | Jazz Ballad | AABA 32 | ✓ |
| 84 | It Don't Mean a Thing | Duke Ellington | 1932 | Jazz Swing | AABA 32 | ✓ |
| 85 | Just Friends | John Klenner | 1931 | Jazz Swing | AABA 32 | ✓ |
| 86 | They Can't Take That Away from Me | George Gershwin | 1937 | Jazz Swing | AABA 32 | ✓ |
| 87 | Star Eyes | Gene de Paul | 1943 | Bossa Nova | AABA 32 |  |
| 88 | A Foggy Day | George Gershwin | 1937 | Jazz Swing | AABA 32 | ✓ |
| 89 | Alone Together | Arthur Schwartz | 1932 | Jazz Ballad | AABA 32 | ✓ |
| 90 | Just You, Just Me | Jesse Greer | 1929 | Jazz Swing | AABA 32 | ✓ |
| 91 | My Romance | Richard Rodgers | 1935 | Jazz Ballad | AABA 32 |  |
| 92 | Things Ain't What They Used to Be | Mercer Ellington | 1942 | Blues Shuffle | 12-bar blues | ✓ |
| 93 | Do Nothin' Till You Hear from Me | Duke Ellington | 1943 | Jazz Ballad | AABA 32 | ✓ |
| 94 | Blue Moon | Richard Rodgers | 1934 | Jazz Ballad | AABA 32 | ✓ |
| 95 | I Surrender Dear | Harry Barris | 1931 | Jazz Ballad | AABA 32 | ✓ |
| 96 | You Stepped Out of a Dream | Nacio Herb Brown | 1940 | Jazz Swing | AABA 32 | ✓ |
| 97 | My One and Only Love | Guy Wood | 1953 | Jazz Ballad | AABA 32 | ✓ |
| 98 | 'S Wonderful | George Gershwin | 1927 | Jazz Swing | AABA 32 | ✓ |
| 99 | Smoke Gets in Your Eyes | Jerome Kern | 1933 | Jazz Ballad | AABA 32 | ✓ |
| 100 | Here's That Rainy Day | Jimmy Van Heusen | 1953 | Jazz Ballad | AABA 32 | ✓ |

## Adding or editing an entry

Append to `STANDARDS` in `src/chart/standards.ts`:

```ts
std(
  101, "my-tune-id", "My Tune", "Composer Name", 1962,
  "jazz", 150, "AABA 32", ["swing", "standard"], false,
  "Cmaj7|Dm7,G7|Cmaj7|Cmaj7|...",
),
```

The argument order is `rank, id, title, composer, year, style, tempo, form, tags,
verified, changes`. Then run `npm test` — `tests/standards.test.ts` checks bar counts,
chord parsing, slot ordering, key detection and full arrangement for every entry.
