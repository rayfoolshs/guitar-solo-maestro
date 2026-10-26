import { useEffect } from 'react';
import { HISTORY, VERSION } from '../version';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VersionModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Version history">
        <div className="modal-head">
          <div>
            <h2>Version history</h2>
            <p>Guitar Solo Maestro · current build v{VERSION}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {HISTORY.map((release) => (
            <section className="release" key={release.version}>
              <div className="release-head">
                <span className="ver">v{release.version}</span>
                <span className="rel-title">{release.title}</span>
                <span className="date">{release.date}</span>
              </div>
              <ul>
                {release.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
          <p className="modal-foot">
            Pre-release milestones. The build plan and changelog live in <code>BUILD_PLAN.md</code> and <code>CHANGELOG.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
