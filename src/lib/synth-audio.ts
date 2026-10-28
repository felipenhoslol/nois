// Gentle synthesized nostalgic vinyl drone / chime generator using Web Audio API
export class VintageSynthAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private oscs: OscillatorNode[] = [];
  private intervalId: number | null = null;

  init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startCrackle() {
    if (!this.ctx || !this.masterGain) return;
    try {
      // Create subtle vinyl hiss / crackle buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // sporadic tiny crackles
        if (Math.random() < 0.002) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.015;
        }
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start();
      this.noiseNode = noise;

      // Play soothing warm pentatonic chord progression
      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C maj
        [220.0, 261.63, 329.63, 440.0], // A min
        [174.61, 220.0, 261.63, 349.23], // F maj
        [196.0, 246.94, 293.66, 392.0], // G maj
      ];
      let step = 0;

      const playChord = () => {
        if (!this.ctx || !this.masterGain) return;
        this.stopOscs();
        const chord = chords[step % chords.length]!;
        step++;
        chord.forEach((freq) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
          this.oscs.push(osc);
        });
      };

      playChord();
      this.intervalId = window.setInterval(playChord, 4000);
    } catch (err) {
      console.warn("Web Audio crackle fallback error:", err);
    }
  }

  stopOscs() {
    this.oscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        // ignore
      }
    });
    this.oscs = [];
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stopOscs();
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }
  }
}
