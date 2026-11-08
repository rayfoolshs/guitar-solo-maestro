import { useEffect, useRef, useState } from 'react';
import { autoName, type Chart } from '../chart/model';
import { downloadChart, parseChartText } from '../chart/io';
import {
  duplicate, listSaved, overwrite, read, remove, rename, saveNew, type SavedChart,
} from '../chart/library';

interface Props {
  open: boolean;
  chart: Chart;
  onClose: () => void;
  onLoad: (chart: Chart) => void;
}

export function ChartsModal({ open, chart, onClose, onLoad }: Props) {
  const [saved, setSaved] = useState<SavedChart[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setSaved(listSaved());

  useEffect(() => {
    if (!open) return;
    refresh();
    setName(chart.name || autoName(chart));
    setError(null);
    setStatus(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!open) return null;

  const showError = (message: string) => { setError(message); setStatus(null); };
  const showStatus = (message: string) => { setStatus(message); setError(null); };

  const handleSaveNew = () => {
    const result = saveNew(chart, name);
    if (!result.ok) return showError(result.error);
    refresh();
    setName(result.saved.name);
    showStatus(`Saved “${result.saved.name}”.`);
  };

  const handleOverwrite = (entry: SavedChart) => {
    const result = overwrite(entry.id, chart);
    if (!result.ok) return showError(result.error);
    refresh();
    showStatus(`Updated “${entry.name}”.`);
  };

  const handleRename = (entry: SavedChart) => {
    const next = window.prompt('Rename chart', entry.name);
    if (next === null) return;
    const result = rename(entry.id, next);
    if (!result.ok) return showError(result.error);
    refresh();
    showStatus(`Renamed to “${result.saved.name}”.`);
  };

  const handleDuplicate = (entry: SavedChart) => {
    const result = duplicate(entry.id);
    if (!result.ok) return showError(result.error);
    refresh();
    showStatus(`Duplicated as “${result.saved.name}”.`);
  };

  const handleDelete = (entry: SavedChart) => {
    if (!window.confirm(`Delete “${entry.name}”? This cannot be undone.`)) return;
    if (!remove(entry.id)) return showError('Could not delete that chart.');
    refresh();
    showStatus(`Deleted “${entry.name}”.`);
  };

  const handleLoad = (entry: SavedChart) => {
    const next = read(entry.id);
    if (!next) return showError('That saved chart no longer exists.');
    onLoad(next);
    onClose();
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const result = parseChartText(await file.text());
    if (!result.ok) return showError(result.error);
    onLoad(result.chart);
    onClose();
  };

  const working = chart.name || autoName(chart);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal charts" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="My charts">
        <div className="modal-head">
          <div>
            <h2>My charts</h2>
            <p>Working chart: {working} · {chart.visibleBars} bars</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="lib-controls">
          <input
            className="lib-name"
            type="text"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chart name"
            aria-label="Chart name"
          />
          <button className="lib-primary" onClick={handleSaveNew}>Save as new</button>
        </div>

        {(error || status) && (
          <p className={`lib-message${error ? ' error' : ''}`}>{error ?? status}</p>
        )}

        <div className="modal-body lib-body">
          {saved.length === 0 ? (
            <p className="lib-empty">No saved charts yet. Use “Save as new” to snapshot the working chart.</p>
          ) : (
            <div className="lib-list">
              {saved.map((entry) => (
                <div className="lib-row" key={entry.id}>
                  <div className="lib-main">
                    <span className="lib-title">{entry.name}</span>
                    <span className="lib-meta">
                      {entry.chart.visibleBars} bars · {entry.chart.tempo} bpm · saved {new Date(entry.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="lib-actions">
                    <button onClick={() => handleLoad(entry)}>Load</button>
                    <button onClick={() => handleOverwrite(entry)} title="Replace this saved chart with the working chart">Update</button>
                    <button onClick={() => handleRename(entry)}>Rename</button>
                    <button onClick={() => handleDuplicate(entry)}>Duplicate</button>
                    <button className="danger" onClick={() => handleDelete(entry)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lib-foot">
          <button onClick={() => { downloadChart(chart); showStatus(`Exported “${working}”.`); }}>
            Export JSON
          </button>
          <button onClick={() => fileRef.current?.click()}>Import JSON</button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.gsm.json,application/json"
            hidden
            onChange={(e) => { void handleImport(e.target.files?.[0]); e.target.value = ''; }}
          />
          <span className="lib-note">Backups contain chord symbols only. Import loads the file into the editor.</span>
        </div>
      </div>
    </div>
  );
}
