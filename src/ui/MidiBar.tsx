import type { MidiInputStatus } from '../audio/midiInput';
import { MIDI_INSTRUMENTS, type MidiInstrumentId } from '../audio/midiInput';

interface Props {
  status: MidiInputStatus;
  instrument: MidiInstrumentId;
  onToggle: () => void;
  onSelectDevice: (id: string) => void;
  onSelectInstrument: (id: MidiInstrumentId) => void;
}

export function MidiBar({ status, instrument, onToggle, onSelectDevice, onSelectInstrument }: Props) {
  return (
    <div className="midibar">
      <button
        className={`midi-toggle${status.enabled ? ' on' : ''}`}
        role="switch"
        aria-checked={status.enabled}
        onClick={onToggle}
        title={status.enabled ? 'Disable MIDI input' : 'Enable MIDI input'}
      >
        <span className="track"><i /></span>
        MIDI
      </button>

      <select
        className="midi-select"
        value={instrument}
        onChange={(e) => onSelectInstrument(e.target.value as MidiInstrumentId)}
        aria-label="MIDI instrument"
      >
        {MIDI_INSTRUMENTS.map((i) => (
          <option key={i.id} value={i.id}>{i.label}</option>
        ))}
      </select>

      {status.enabled ? (
        <>
          <select
            className="midi-select"
            value={status.activeId ?? ''}
            onChange={(e) => onSelectDevice(e.target.value)}
            disabled={!status.devices.length}
            aria-label="MIDI input device"
          >
            {status.devices.length === 0 && <option value="">No MIDI devices</option>}
            {status.devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <span className="midi-status">
            {status.error ?? (status.devices.length ? 'Ready' : 'No MIDI devices — click the keys or use A–K')}
          </span>
        </>
      ) : (
        <span className="midi-status">
          {status.error ?? (status.supported
            ? 'MIDI off — click the keys or use A–K'
            : 'No Web MIDI — click the keys or use A–K')}
        </span>
      )}
    </div>
  );
}
