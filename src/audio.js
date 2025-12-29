class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicInterval = null;
    this.retroSongTimeout = null;
    this.masterVolume = 0.7;
    this.retroSongActive = false;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2; // Play for 2-3 waves
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.8;
    this.sfxGain.gain.value = 1.0;
    this.masterGain.gain.value = this.masterVolume;
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {
        // Resume might be denied, but we tried
      });
    }
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
            gain: 0.3,
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
            gain: 0.35,
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
            gain: 0.4,
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
    // Fast chiptune in bitcore/demo style - upbeat version
    if (!this.ensureContext()) return;

    // Fade out the looping background music first
    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random()); // 2 or 3 waves

    // Start retro song after fade completes
    setTimeout(() => {
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

      // Fast synth melody - retro/upbeat (SLOWER)
      const melody = [
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 659.25, d: 0.12 }, // E5
        { f: 587.33, d: 0.12 }, // D5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 880.0, d: 0.18 }, // A5
        { f: 783.99, d: 0.12 }, // G5
        { f: 659.25, d: 0.12 }, // E5
        { f: 587.33, d: 0.12 }, // D5
        { f: 523.25, d: 0.12 }, // C5
        { f: 587.33, d: 0.12 }, // D5
        { f: 659.25, d: 0.18 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 659.25, d: 0.12 }, // E5
        { f: 587.33, d: 0.12 }, // D5
      ];

      const loopDuration = 1200; // 1.2s (bass line only)

      const loop = () => {
        const now = this.ctx.currentTime;

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
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong2() {
    // Dark/mysterious chiptune - different atmosphere
    if (!this.ensureContext()) return;

    // Fade out the looping background music first
    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random()); // 2 or 3 waves

    // Start alternative retro song after fade completes
    setTimeout(() => {
      // Slower, deeper bass line
      const bassLine = [
        { f: 82.41, d: 0.2 }, // E2
        { f: 110.0, d: 0.2 }, // A2
        { f: 92.5, d: 0.2 }, // Bb2
        { f: 110.0, d: 0.2 }, // A2
      ];

      const melody = [
        { f: 493.88, d: 0.1 }, // B4
        { f: 440.0, d: 0.1 }, // A4
        { f: 392.0, d: 0.1 }, // G4
        { f: 440.0, d: 0.1 }, // A4
        { f: 329.63, d: 0.2 }, // E4
        { f: 392.0, d: 0.2 }, // G4
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;

        // Play bass line
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "triangle",
              gain: 0.22,
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
              to: m.f * 0.98,
              duration: m.d,
              type: "square",
              gain: 0.15,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong3() {
    // Energetic/funky chiptune - upbeat variation
    if (!this.ensureContext()) return;

    // Fade out the looping background music first
    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random()); // 2 or 3 waves

    // Start funky retro song after fade completes
    setTimeout(() => {
      // Funky bouncy bass
      const bassLine = [
        { f: 130.81, d: 0.1 }, // C3
        { f: 164.81, d: 0.1 }, // E3
        { f: 130.81, d: 0.1 }, // C3
        { f: 196.0, d: 0.1 }, // G3
        { f: 130.81, d: 0.1 }, // C3
        { f: 164.81, d: 0.1 }, // E3
        { f: 130.81, d: 0.1 }, // C3
        { f: 174.61, d: 0.1 }, // F3
      ];

      const melody = [
        { f: 523.25, d: 0.1 }, // C5
        { f: 659.25, d: 0.1 }, // E5
        { f: 783.99, d: 0.1 }, // G5
        { f: 659.25, d: 0.1 }, // E5
        { f: 587.33, d: 0.1 }, // D5
        { f: 523.25, d: 0.1 }, // C5
        { f: 587.33, d: 0.2 }, // D5
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;

        // Play bass line
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "square",
              gain: 0.2,
            },
            this.sfxGain,
            tBass
          );
          tBass += n.d;
        }

        // Play melody
        let tMel = now + 0.1;
        for (const m of melody) {
          this._tone(
            {
              from: m.f,
              to: m.f * 0.97,
              duration: m.d,
              type: "sine",
              gain: 0.16,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong4() {
    // Smooth/atmospheric chiptune - sine wave
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random()); // 2 or 3 waves

    setTimeout(() => {
      const bassLine = [
        { f: 92.5, d: 0.12 }, // Bb2
        { f: 110.0, d: 0.12 }, // A2
        { f: 82.41, d: 0.12 }, // E2
        { f: 110.0, d: 0.12 }, // A2
        { f: 92.5, d: 0.12 }, // Bb2
        { f: 82.41, d: 0.12 }, // E2
        { f: 110.0, d: 0.04 }, // A2 (quick punctuation)
      ];

      const melody = [
        { f: 369.99, d: 0.16 }, // F#4
        { f: 440.0, d: 0.16 }, // A4
        { f: 329.63, d: 0.16 }, // E4
        { f: 440.0, d: 0.16 }, // A4
        { f: 369.99, d: 0.16 }, // F#4
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;

        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "sine",
              gain: 0.2,
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
              to: m.f * 0.99,
              duration: m.d,
              type: "triangle",
              gain: 0.14,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong5() {
    // Aggressive/fast chiptune - rapid sawtooth
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random()); // 2 or 3 waves

    setTimeout(() => {
      const bassLine = [
        { f: 146.83, d: 0.08 }, // D3
        { f: 164.81, d: 0.08 }, // E3
        { f: 146.83, d: 0.08 }, // D3
        { f: 130.81, d: 0.08 }, // C3
        { f: 146.83, d: 0.08 }, // D3
        { f: 164.81, d: 0.08 }, // E3
        { f: 196.0, d: 0.08 }, // G3
        { f: 174.61, d: 0.08 }, // F3
      ];

      const melody = [
        { f: 587.33, d: 0.08 }, // D5
        { f: 659.25, d: 0.08 }, // E5
        { f: 783.99, d: 0.08 }, // G5
        { f: 659.25, d: 0.08 }, // E5
        { f: 587.33, d: 0.08 }, // D5
        { f: 523.25, d: 0.08 }, // C5
        { f: 659.25, d: 0.08 }, // E5
        { f: 587.33, d: 0.08 }, // D5
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;

        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "sawtooth",
              gain: 0.22,
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
              to: m.f * 0.97,
              duration: m.d,
              type: "square",
              gain: 0.17,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong6() {
    // Dark/ominous chiptune - deep triangle bass
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random()); // 2 or 3 waves

    setTimeout(() => {
      const bassLine = [
        { f: 65.41, d: 0.2 }, // C2 (very low)
        { f: 82.41, d: 0.2 }, // E2
        { f: 73.42, d: 0.2 }, // D2
        { f: 82.41, d: 0.2 }, // E2
      ];

      const melody = [
        { f: 261.63, d: 0.2 }, // C4
        { f: 329.63, d: 0.2 }, // E4
        { f: 293.66, d: 0.2 }, // D4
        { f: 329.63, d: 0.2 }, // E4
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;

        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "triangle",
              gain: 0.24,
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
              to: m.f * 0.98,
              duration: m.d,
              type: "sawtooth",
              gain: 0.13,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong7() {
    // Bouncy/playful chiptune - alternating square wave
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random());

    setTimeout(() => {
      const bassLine = [
        { f: 174.61, d: 0.1 }, // F3
        { f: 130.81, d: 0.1 }, // C3
        { f: 174.61, d: 0.1 }, // F3
        { f: 220.0, d: 0.1 }, // A3
        { f: 174.61, d: 0.1 }, // F3
        { f: 130.81, d: 0.1 }, // C3
        { f: 196.0, d: 0.1 }, // G3
        { f: 174.61, d: 0.1 }, // F3
      ];

      const melody = [
        { f: 698.46, d: 0.1 }, // F5
        { f: 523.25, d: 0.1 }, // C5
        { f: 698.46, d: 0.1 }, // F5
        { f: 880.0, d: 0.1 }, // A5
        { f: 698.46, d: 0.1 }, // F5
        { f: 783.99, d: 0.1 }, // G5
        { f: 698.46, d: 0.2 }, // F5
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "square",
              gain: 0.21,
            },
            this.sfxGain,
            tBass
          );
          tBass += n.d;
        }

        // Play melody
        let tMel = now + 0.05;
        for (const m of melody) {
          this._tone(
            {
              from: m.f,
              to: m.f * 0.98,
              duration: m.d,
              type: "sine",
              gain: 0.15,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong8() {
    // Epic/heroic chiptune - rising sawtooth
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random());

    setTimeout(() => {
      const bassLine = [
        { f: 98.0, d: 0.15 }, // G2
        { f: 130.81, d: 0.15 }, // C3
        { f: 146.83, d: 0.15 }, // D3
        { f: 164.81, d: 0.15 }, // E3
        { f: 146.83, d: 0.15 }, // D3
        { f: 130.81, d: 0.15 }, // C3
        { f: 110.0, d: 0.15 }, // A2
        { f: 98.0, d: 0.15 }, // G2
      ];

      const melody = [
        { f: 392.0, d: 0.15 }, // G4
        { f: 523.25, d: 0.15 }, // C5
        { f: 587.33, d: 0.15 }, // D5
        { f: 659.25, d: 0.15 }, // E5
        { f: 587.33, d: 0.15 }, // D5
        { f: 523.25, d: 0.15 }, // C5
        { f: 440.0, d: 0.3 }, // A4
      ];

      const loopDuration = 1200;

      const loop = () => {
        const now = this.ctx.currentTime;
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "sawtooth",
              gain: 0.19,
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
              to: m.f * 0.96,
              duration: m.d,
              type: "square",
              gain: 0.16,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong9() {
    // Minimal/techno chiptune - pulsing triangle
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random());

    setTimeout(() => {
      const bassLine = [
        { f: 110.0, d: 0.2 }, // A2
        { f: 110.0, d: 0.1 }, // A2
        { f: 130.81, d: 0.1 }, // C3
        { f: 110.0, d: 0.2 }, // A2
        { f: 110.0, d: 0.1 }, // A2
        { f: 146.83, d: 0.1 }, // D3
      ];

      const melody = [
        { f: 440.0, d: 0.4 }, // A4
        { f: 523.25, d: 0.2 }, // C5
        { f: 587.33, d: 0.2 }, // D5
      ];

      const loopDuration = 800;

      const loop = () => {
        const now = this.ctx.currentTime;
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "triangle",
              gain: 0.23,
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
              to: m.f * 0.99,
              duration: m.d,
              type: "sine",
              gain: 0.12,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong10() {
    // Retro arcade - fast square wave
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random());

    setTimeout(() => {
      const bassLine = [
        { f: 164.81, d: 0.06 }, // E3
        { f: 196.0, d: 0.06 }, // G3
        { f: 164.81, d: 0.06 }, // E3
        { f: 220.0, d: 0.06 }, // A3
        { f: 164.81, d: 0.06 }, // E3
        { f: 196.0, d: 0.06 }, // G3
        { f: 164.81, d: 0.06 }, // E3
        { f: 130.81, d: 0.06 }, // C3
        { f: 164.81, d: 0.06 }, // E3
        { f: 196.0, d: 0.06 }, // G3
      ];

      const melody = [
        { f: 659.25, d: 0.06 }, // E5
        { f: 783.99, d: 0.06 }, // G5
        { f: 880.0, d: 0.06 }, // A5
        { f: 1046.5, d: 0.06 }, // C6
        { f: 880.0, d: 0.06 }, // A5
        { f: 783.99, d: 0.06 }, // G5
        { f: 659.25, d: 0.06 }, // E5
        { f: 523.25, d: 0.12 }, // C5
      ];

      const loopDuration = 600;

      const loop = () => {
        const now = this.ctx.currentTime;
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "square",
              gain: 0.19,
            },
            this.sfxGain,
            tBass
          );
          tBass += n.d;
        }

        // Play melody
        let tMel = now + 0.12;
        for (const m of melody) {
          this._tone(
            {
              from: m.f,
              to: m.f * 0.98,
              duration: m.d,
              type: "triangle",
              gain: 0.14,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong11() {
    // Deep/menacing chiptune - low sawtooth
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random());

    setTimeout(() => {
      const bassLine = [
        { f: 73.42, d: 0.25 }, // D2
        { f: 87.31, d: 0.25 }, // F2
        { f: 73.42, d: 0.25 }, // D2
        { f: 65.41, d: 0.25 }, // C2
      ];

      const melody = [
        { f: 293.66, d: 0.25 }, // D4
        { f: 349.23, d: 0.25 }, // F4
        { f: 293.66, d: 0.25 }, // D4
        { f: 261.63, d: 0.25 }, // C4
      ];

      const loopDuration = 1000;

      const loop = () => {
        const now = this.ctx.currentTime;
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "sawtooth",
              gain: 0.25,
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
              to: m.f * 0.97,
              duration: m.d,
              type: "square",
              gain: 0.14,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  playRetroSong12() {
    // Cheerful/uplifting chiptune - bright sine wave
    if (!this.ensureContext()) return;

    this.stopMusicWithFade(0.6);
    this.retroSongActive = true;
    this.retroSongWaveCount = 0;
    this.retroSongWavesToPlay = 2 + Math.floor(Math.random());

    setTimeout(() => {
      const bassLine = [
        { f: 130.81, d: 0.12 }, // C3
        { f: 164.81, d: 0.12 }, // E3
        { f: 196.0, d: 0.12 }, // G3
        { f: 164.81, d: 0.12 }, // E3
        { f: 146.83, d: 0.12 }, // D3
        { f: 130.81, d: 0.12 }, // C3
        { f: 110.0, d: 0.12 }, // A2
      ];

      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 659.25, d: 0.12 }, // E5
        { f: 587.33, d: 0.12 }, // D5
        { f: 523.25, d: 0.12 }, // C5
        { f: 440.0, d: 0.12 }, // A4
      ];

      const loopDuration = 840;

      const loop = () => {
        const now = this.ctx.currentTime;
        let tBass = now;
        for (const n of bassLine) {
          this._tone(
            {
              from: n.f,
              to: n.f,
              duration: n.d,
              type: "sine",
              gain: 0.22,
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
              to: m.f * 0.98,
              duration: m.d,
              type: "triangle",
              gain: 0.16,
            },
            this.sfxGain,
            tMel
          );
          tMel += m.d;
        }
      };

      loop();
      this.musicInterval = setInterval(loop, loopDuration);
    }, 600);
  }

  onWaveComplete() {
    // Called when a wave completes - track wave count for retro songs
    // Songs continue looping until game.js triggers a new song or game ends/pauses
    if (this.retroSongActive) {
      this.retroSongWaveCount++;
    }
  }

  stopMusicWithFade(duration = 0.8) {
    if (!this.musicInterval || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    setTimeout(() => {
      this.stopMusic();
      this.musicGain.gain.value = 0.8; // Reset for next song
    }, duration * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    // Quickly fade out any remaining music to silence lingering oscillators
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
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
