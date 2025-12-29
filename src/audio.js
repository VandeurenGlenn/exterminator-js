class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicInterval = null;
    this.masterVolume = 0.7;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.65;
    this.sfxGain.gain.value = 0.9;
    this.masterGain.gain.value = this.masterVolume;
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return !!this.ctx;
  }

  setMasterVolume(value) {
    this.masterVolume = Math.min(1, Math.max(0, value));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  setMusicVolume(value) {
    if (this.musicGain)
      this.musicGain.gain.value = Math.min(1, Math.max(0, value));
  }

  setSfxVolume(value) {
    if (this.sfxGain) this.sfxGain.gain.value = Math.min(1, Math.max(0, value));
  }

  playShoot() {
    this._tone({
      from: 880,
      to: 680,
      duration: 0.08,
      type: "square",
      gain: 0.28,
    });
  }

  playBuild() {
    this._tone({
      from: 220,
      to: 160,
      duration: 0.12,
      type: "sawtooth",
      gain: 0.18,
    });
  }

  playUpgrade() {
    this._tone({
      from: 360,
      to: 520,
      duration: 0.18,
      type: "triangle",
      gain: 0.22,
    });
  }

  playSell() {
    this._tone({
      from: 300,
      to: 200,
      duration: 0.15,
      type: "square",
      gain: 0.16,
    });
  }

  playTrap() {
    this._tone({
      from: 520,
      to: 320,
      duration: 0.16,
      type: "sawtooth",
      gain: 0.2,
    });
  }

  playEnemyHit() {
    this._tone({
      from: 520,
      to: 420,
      duration: 0.06,
      type: "square",
      gain: 0.14,
    });
  }

  playEnemyDeath() {
    this._tone({
      from: 180,
      to: 80,
      duration: 0.18,
      type: "triangle",
      gain: 0.22,
    });
  }

  playBaseHit() {
    this._tone({
      from: 120,
      to: 60,
      duration: 0.25,
      type: "sawtooth",
      gain: 0.3,
    });
  }

  playClick() {
    this._tone({
      from: 400,
      to: 350,
      duration: 0.05,
      type: "square",
      gain: 0.12,
    });
  }

  startMusic() {
    if (!this.ensureContext()) return;
    if (this.musicInterval) return;
    const pad = [
      { f: 174.61, d: 0.8 }, // F3
      { f: 196.0, d: 0.8 }, // G3
      { f: 233.08, d: 0.8 }, // Bb3
      { f: 196.0, d: 0.8 }, // G3
      { f: 164.81, d: 0.8 }, // E3 (new variation)
      { f: 196.0, d: 0.8 }, // G3
      { f: 220.0, d: 0.8 }, // A3 (new variation)
      { f: 196.0, d: 0.8 }, // G3
    ];

    const bass = [
      { f: 87.31, d: 1.6 }, // F2
      { f: 98.0, d: 1.6 }, // G2
      { f: 82.41, d: 1.6 }, // E2 (new variation)
      { f: 98.0, d: 1.6 }, // G2
    ];

    const arp = [
      261.63,
      311.13,
      392.0,
      349.23, // C4 Eb4 G4 F4
      293.66,
      349.23,
      440.0,
      392.0, // D4 F4 A4 G4
    ];

    const melody = [
      // Section A: ascending phrase
      { f: 440.0, d: 0.2 }, // A4
      { f: 523.25, d: 0.2 }, // C5
      { f: 587.33, d: 0.3 }, // D5
      { f: 523.25, d: 0.2 }, // C5
      { f: 440.0, d: 0.2 }, // A4
      { f: 392.0, d: 0.4 }, // G4
      { f: 349.23, d: 0.2 }, // F4
      { f: 440.0, d: 0.2 }, // A4
      // Section B: descending variation
      { f: 523.25, d: 0.3 }, // C5
      { f: 587.33, d: 0.2 }, // D5
      { f: 523.25, d: 0.2 }, // C5
      { f: 440.0, d: 0.4 }, // A4
      { f: 392.0, d: 0.2 }, // G4
      { f: 349.23, d: 0.2 }, // F4
      { f: 311.13, d: 0.3 }, // Eb4 (lower range)
      { f: 349.23, d: 0.4 }, // F4
    ];

    const loop = () => {
      const now = this.ctx.currentTime;

      // Warm pad (tighter gaps)
      let tPad = now;
      for (const n of pad) {
        this._tone(
          {
            from: n.f,
            to: n.f * 0.985,
            duration: n.d,
            type: "sine",
            gain: 0.18,
          },
          this.musicGain,
          tPad
        );
        tPad += n.d;
      }

      // Bass line (reduced pauses)
      let tBass = now;
      for (const n of bass) {
        this._tone(
          {
            from: n.f,
            to: n.f * 0.98,
            duration: n.d,
            type: "triangle",
            gain: 0.22,
          },
          this.musicGain,
          tBass
        );
        tBass += n.d;
      }

      // Melodic line (more prominent)
      let tMel = now;
      for (const m of melody) {
        this._tone(
          {
            from: m.f,
            to: m.f * 0.96,
            duration: m.d,
            type: "sine",
            gain: 0.28,
          },
          this.musicGain,
          tMel
        );
        tMel += m.d;
      }
    };

    loop();
    this.musicInterval = setInterval(loop, 6400);
  }

  playWaveClear() {
    // Retro chiptune victory flourish - fast ascending arpeggio
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.08 }, // C5
      { f: 659.25, d: 0.08 }, // E5
      { f: 783.99, d: 0.08 }, // G5
      { f: 1046.5, d: 0.12 }, // C6
    ];
    let t = now;
    for (const n of notes) {
      this._tone(
        {
          from: n.f,
          to: n.f,
          duration: n.d,
          type: "square",
          gain: 0.25,
        },
        this.sfxGain,
        t
      );
      t += n.d;
    }
  }

  playWaveComplete(waveNumber) {
    // Wave-specific celebration: different melodies based on wave
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;

    const melodies = [
      // Wave 1: Simple celebratory
      [523.25, 587.33, 659.25, 783.99], // C5 D5 E5 G5
      // Wave 2: Rising
      [587.33, 659.25, 783.99, 880.0], // D5 E5 G5 A5
      // Wave 3: Triumphant
      [659.25, 783.99, 880.0, 1046.5], // E5 G5 A5 C6
      // Wave 4+: Epic
      [523.25, 659.25, 783.99, 1046.5, 880.0, 783.99], // C5 E5 G5 C6 A5 G5
    ];

    const melody = melodies[Math.min(waveNumber - 1, melodies.length - 1)];
    let t = now;
    for (const f of melody) {
      this._tone(
        {
          from: f,
          to: f,
          duration: 0.12,
          type: "square",
          gain: 0.28,
        },
        this.sfxGain,
        t
      );
      t += 0.12;
    }
  }

  playRetroSong() {
    // Fast chiptune in bitcore/demo style - fades out background music first
    if (!this.ensureContext()) return;
    
    // Fade out the looping background music
    this.stopMusicWithFade(0.6);
    
    // Start retro song after fade completes
    setTimeout(() => {
      const now = this.ctx.currentTime;

      // Fast pulsing bass line
      const bassLine = [
        { f: 110.0, d: 0.15 }, // A2
        { f: 164.81, d: 0.15 }, // E3
        { f: 110.0, d: 0.15 }, // A2
        { f: 196.0, d: 0.15 }, // G3
        { f: 110.0, d: 0.15 }, // A2
        { f: 164.81, d: 0.15 }, // E3
        { f: 110.0, d: 0.15 }, // A2
        { f: 146.83, d: 0.15 }, // D3
      ];

      // Fast synth melody - retro/upbeat
      const melody = [
        { f: 659.25, d: 0.06 }, // E5
        { f: 783.99, d: 0.06 }, // G5
        { f: 659.25, d: 0.06 }, // E5
        { f: 587.33, d: 0.06 }, // D5
        { f: 659.25, d: 0.06 }, // E5
        { f: 783.99, d: 0.06 }, // G5
        { f: 880.0, d: 0.09 }, // A5
        { f: 783.99, d: 0.06 }, // G5
        { f: 659.25, d: 0.06 }, // E5
        { f: 587.33, d: 0.06 }, // D5
        { f: 523.25, d: 0.06 }, // C5
        { f: 587.33, d: 0.06 }, // D5
        { f: 659.25, d: 0.09 }, // E5
        { f: 783.99, d: 0.06 }, // G5
        { f: 659.25, d: 0.06 }, // E5
        { f: 587.33, d: 0.06 }, // D5
      ];

      // Play bass line
      let tBass = now;
      for (const n of bassLine) {
        this._tone(
          {
            from: n.f,
            to: n.f,
            duration: n.d,
            type: "sawtooth",
            gain: 0.18,
          },
          this.sfxGain,
          tBass
        );
        tBass += n.d;
      }

      // Play melody
      let tMel = now;
      for (const m of melody) {
        this._tone(
          {
            from: m.f,
            to: m.f,
            duration: m.d,
            type: "square",
            gain: 0.32,
          },
          this.sfxGain,
          tMel
        );
        tMel += m.d;
      }
    }, 600);
  }

  stopMusicWithFade(duration = 0.8) {
    if (!this.musicInterval || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    setTimeout(() => {
      this.stopMusic();
      this.musicGain.gain.value = 0.65; // Reset for next song
    }, duration * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  _tone(opts, gainNode = null, startTime = null) {
    if (!this.ensureContext()) return;
    const { from, to, duration, type, gain } = opts;
    const osc = this.ctx.createOscillator();
    const gainStage = this.ctx.createGain();
    const dest = gainNode || this.sfxGain;
    if (!dest) return;
    osc.type = type;
    osc.frequency.setValueAtTime(from, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      to,
      this.ctx.currentTime + duration
    );
    const now = this.ctx.currentTime;
    const start = startTime ?? now;
    gainStage.gain.setValueAtTime(gain, start);
    gainStage.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gainStage).connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export const audio = new AudioManager();
