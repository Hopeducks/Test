import { gameStateManager } from './game-state';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch((err) => console.warn('Failed to resume AudioContext:', err));
      }
      return this.ctx;
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
      return null;
    }
  }

  playClick() {
    try {
      if (!gameStateManager.getSoundOn()) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Failed to play click sound:', e);
    }
  }

  playCorrect() {
    try {
      if (!gameStateManager.getSoundOn()) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        } catch (err) {
          console.warn('Failed to play tone in playCorrect:', err);
        }
      };

      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.08, 0.15); // E5
      playTone(783.99, now + 0.16, 0.15); // G5
      playTone(1046.50, now + 0.24, 0.3); // C6
    } catch (e) {
      console.warn('Failed to play correct sound:', e);
    }
  }

  playWrong() {
    try {
      if (!gameStateManager.getSoundOn()) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Failed to play wrong sound:', e);
    }
  }

  playThrow() {
    try {
      if (!gameStateManager.getSoundOn()) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Failed to play throw sound:', e);
    }
  }

  playCatchSuccess() {
    try {
      if (!gameStateManager.getSoundOn()) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = type;
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.1, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        } catch (err) {
          console.warn('Failed to play tone in playCatchSuccess:', err);
        }
      };

      // Triumph arpeggio
      playTone(587.33, now, 0.15, 'triangle'); // D5
      playTone(739.99, now + 0.08, 0.15, 'triangle'); // F#5
      playTone(880.00, now + 0.16, 0.15, 'triangle'); // A5
      playTone(1174.66, now + 0.24, 0.3, 'sine'); // D6
      playTone(1468.32, now + 0.36, 0.5, 'sine'); // F#6
    } catch (e) {
      console.warn('Failed to play catch success sound:', e);
    }
  }

  playCatchFail() {
    try {
      if (!gameStateManager.getSoundOn()) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        } catch (err) {
          console.warn('Failed to play tone in playCatchFail:', err);
        }
      };

      // Descending disappointment beeps
      playTone(220.00, now, 0.18); // A3
      playTone(185.00, now + 0.2, 0.25); // F#3
    } catch (e) {
      console.warn('Failed to play catch fail sound:', e);
    }
  }
}

export const gameAudio = new SoundSynthesizer();
export default gameAudio;
