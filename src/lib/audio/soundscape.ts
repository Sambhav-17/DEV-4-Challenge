// Procedural Web Audio API soundscape - Zero external mp3/wav files

class SoundscapeManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private isDronePlaying: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.droneGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.droneGain.gain.cancelScheduledValues(now);
      this.droneGain.gain.linearRampToValueAtTime(muted ? 0 : 0.08, now + 0.5);
    }
    if (!muted && !this.isDronePlaying) {
      this.startAmbientDrone();
    }
  }

  toggleSound(): boolean {
    this.setMuted(!this.isMuted);
    return !this.isMuted;
  }

  // Bell or Tibetan singing bowl sound
  playVeilBell() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Fundamental ~ 216Hz, harmonic 432Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(216, now);
    osc.frequency.exponentialRampToValueAtTime(214, now + 4);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(432, now);
    subOsc.frequency.exponentialRampToValueAtTime(428, now + 3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 4.6);
    subOsc.stop(now + 4.6);
  }

  // Soft glowing chime when lighting a candle
  playCandleChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [528, 660, 792]; // harmonic triad
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 2.1);
    });
  }

  // Soft vintage terminal mechanical keystroke
  playKeystroke(pitch: number = 800) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch + (Math.random() * 80 - 40), now);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Ambient background drone
  startAmbientDrone() {
    if (this.isDronePlaying) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.droneGain = ctx.createGain();
      this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, now);

      // Low frequency ethereal drone
      this.droneOsc1 = ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, now); // A1

      this.droneOsc2 = ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(110.5, now); // subtle detune beat

      // Gentle filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      this.droneOsc1.connect(filter);
      this.droneOsc2.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.isDronePlaying = true;
    } catch {
      // Audio autoplay restrictions
    }
  }

  stopAmbientDrone() {
    if (!this.isDronePlaying) return;
    try {
      this.droneOsc1?.stop();
      this.droneOsc2?.stop();
      this.droneOsc1?.disconnect();
      this.droneOsc2?.disconnect();
      this.isDronePlaying = false;
    } catch {}
  }
}

export const soundscape = new SoundscapeManager();
