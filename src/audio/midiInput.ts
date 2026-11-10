/**
 * Web MIDI input: connects to a hardware keyboard, parses note messages and
 * exposes the selected device. The audio engine is separate so this module
 * stays free of audio code.
 */

export interface MidiNote {
  midi: number;
  velocity: number;
  on: boolean;
  /** True for the "all notes off" controller message. */
  allOff?: boolean;
}

export interface MidiDevice {
  id: string;
  name: string;
}

export interface MidiInputStatus {
  supported: boolean;
  enabled: boolean;
  devices: MidiDevice[];
  activeId: string | null;
  error: string | null;
}

/** GM programs for the four instruments offered on the keyboard. */
export const MIDI_INSTRUMENTS = [
  { id: 'piano', label: 'Piano', program: 0 },
  { id: 'organ', label: 'Organ', program: 19 },
  { id: 'flute', label: 'Flute', program: 73 },
  { id: 'sax', label: 'Saxophone', program: 65 },
] as const;

export type MidiInstrumentId = (typeof MIDI_INSTRUMENTS)[number]['id'];

export function programOf(id: MidiInstrumentId): number {
  return MIDI_INSTRUMENTS.find((i) => i.id === id)?.program ?? 0;
}

/** Parse a MIDI message into a note event, or null when it is not a note. */
export function parseMidiMessage(data: Uint8Array | null): MidiNote | null {
  if (!data || data.length < 2) return null;
  const status = data[0] & 0xf0;
  const note = data[1];
  const velocity = data[2] ?? 0;
  if (status === 0x90 && velocity > 0) return { midi: note, velocity, on: true };
  if (status === 0x80 || (status === 0x90 && velocity === 0)) return { midi: note, velocity: 0, on: false };
  if (status === 0xb0 && note === 123) return { midi: -1, velocity: 0, on: false, allOff: true };
  return null;
}

type NoteListener = (note: MidiNote) => void;
type StatusListener = (status: MidiInputStatus) => void;

class MidiInput {
  private access: MIDIAccess | null = null;
  private noteListeners = new Set<NoteListener>();
  private statusListeners = new Set<StatusListener>();
  private handlers = new Map<string, (event: MIDIMessageEvent) => void>();
  private connecting: Promise<void> | null = null;
  private status: MidiInputStatus = {
    supported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    enabled: false,
    devices: [],
    activeId: null,
    error: null,
  };

  getStatus(): MidiInputStatus {
    return this.status;
  }

  subscribe(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => { this.statusListeners.delete(listener); };
  }

  onNote(listener: NoteListener): () => void {
    this.noteListeners.add(listener);
    return () => { this.noteListeners.delete(listener); };
  }

  async enable(): Promise<void> {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      this.update({ supported: false, enabled: false, error: 'This browser has no Web MIDI support.' });
      return;
    }
    if (this.connecting) return this.connecting;
    this.update({ supported: true });
    this.connecting = (async () => {
      try {
        const access = await navigator.requestMIDIAccess({ sysex: false });
        this.access = access;
        access.onstatechange = () => this.refresh();
        this.update({ enabled: true, error: null });
        this.refresh();
      } catch (err) {
        const name = err instanceof Error ? err.name : '';
        const blocked = name === 'NotAllowedError' || name === 'SecurityError';
        this.update({
          enabled: false,
          error: blocked
            ? 'MIDI is blocked by this browser. Allow MIDI devices in site settings (or open in Chrome/Edge), or play with the keys below.'
            : `MIDI could not start: ${String(err)}`,
        });
      } finally {
        this.connecting = null;
      }
    })();
    return this.connecting;
  }

  disable(): void {
    this.access?.inputs.forEach((input) => this.detach(input));
    this.access = null;
    this.update({ enabled: false, devices: [], activeId: null, error: null });
  }

  select(id: string): void {
    this.update({ activeId: id });
    this.refresh();
  }

  private refresh(): void {
    const access = this.access;
    if (!access) return;
    const devices: MidiDevice[] = [];
    access.inputs.forEach((input) => {
      devices.push({ id: input.id, name: input.name || input.id });
      this.detach(input);
      this.attach(input);
    });
    const activeId = this.status.activeId && devices.some((d) => d.id === this.status.activeId)
      ? this.status.activeId
      : devices[0]?.id ?? null;
    this.update({ devices, activeId });
  }

  private attach(input: MIDIInput): void {
    const handler = (event: MIDIMessageEvent) => this.handle(event);
    input.onmidimessage = handler;
    this.handlers.set(input.id, handler);
  }

  private detach(input: MIDIInput): void {
    const handler = this.handlers.get(input.id);
    if (handler) {
      input.onmidimessage = null;
      this.handlers.delete(input.id);
    }
  }

  private handle(event: MIDIMessageEvent): void {
    const target = event.target as MIDIInput | null;
    if (target && this.status.activeId && target.id !== this.status.activeId) return;
    const note = parseMidiMessage(event.data);
    if (note) this.noteListeners.forEach((listener) => listener(note));
  }

  private update(patch: Partial<MidiInputStatus>): void {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((listener) => listener(this.status));
  }
}

export const midiInput = new MidiInput();
