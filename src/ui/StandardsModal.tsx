import { useEffect, useMemo, useState } from 'react';
import type { Chart, Style } from '../chart/model';
import { STANDARDS, standardToChart } from '../chart/standards';
import { styleLabel } from '../arrange/styles';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (chart: Chart) => void;
}

type StyleFilter = 'all' | Style;

const STYLE_FILTERS: Array<{ id: StyleFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'jazz', label: 'Swing' },
  { id: 'ballad', label: 'Ballad' },
  { id: 'shuffle', label: 'Blues' },
  { id: 'bossa', label: 'Latin' },
];

const TAG_FILTERS = ['swing', 'ballad', 'bebop', 'latin', 'blues', 'standard'];

export function StandardsModal({ open, onClose, onLoad }: Props) {
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<StyleFilter>('all');
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setStyle('all');
    setTag(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STANDARDS.filter((s) => {
      if (style !== 'all' && s.style !== style) return false;
      if (tag && !s.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.composer.toLowerCase().includes(q) ||
        String(s.year).includes(q)
      );
    });
  }, [query, style, tag]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal standards" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Core 100 standards">
        <div className="modal-head">
          <div>
            <h2>Core 100 standards</h2>
            <p>Practice-oriented blend of popularity and jam-session lists · chord symbols only</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="std-controls">
          <input
            className="std-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, composer or year…"
            aria-label="Search standards"
          />
          <div className="std-chips">
            {STYLE_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`std-chip${style === f.id ? ' on' : ''}`}
                onClick={() => setStyle(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="std-chips std-tags">
          {TAG_FILTERS.map((t) => (
            <button
              key={t}
              className={`std-chip${tag === t ? ' on' : ''}`}
              onClick={() => setTag(tag === t ? null : t)}
            >
              {t}
            </button>
          ))}
          <span className="std-count">{results.length} tunes</span>
        </div>

        <div className="modal-body std-body">
          {results.length === 0 && <p className="std-empty">No tunes match that filter.</p>}
          <div className="std-list">
            {results.map((s) => (
              <button
                className="std-row"
                key={s.id}
                onClick={() => { onLoad(standardToChart(s)); onClose(); }}
                title={`${s.title} — ${s.form}`}
              >
                <span className="std-rank">{s.rank}</span>
                <span className="std-main">
                  <span className="std-title">{s.title}</span>
                  <span className="std-meta">{s.composer} · {s.year} · {s.form}</span>
                </span>
                <span className="std-style">{styleLabel(s.style)}</span>
                <span className="std-bars">{s.changes.split('|').length} bars</span>
                {!s.verified && <span className="std-unverified" title="Changes not yet checked against a published lead sheet">•</span>}
              </button>
            ))}
          </div>
        </div>

        <p className="modal-foot">
          Chord changes are practice aids, not publisher lead sheets. Use your own reference for gig-accurate changes.
        </p>
      </div>
    </div>
  );
}
