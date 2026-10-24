"use client";

/**
 * Web Audio API Sound Generator for CaféFlow BD KDS & POS Alerts
 * Synthesizes crisp kitchen bells & chimes without external MP3 network dependencies.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  public unlock(): boolean {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      // Play a zero-volume buffer to fully unlock iOS/Android autoplay restriction
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);

      this.isUnlocked = true;
      return true;
    } catch (e) {
      console.warn("[SoundManager] AudioContext unlock failed:", e);
      return false;
    }
  }

  public getUnlocked(): boolean {
    return this.isUnlocked && !!this.ctx && this.ctx.state === "running";
  }

  /**
   * Two-tone pleasant kitchen chime for incoming orders: D5 (587.33Hz) -> A5 (880Hz)
   */
  public playNewOrderChime() {
    if (!this.ctx || this.ctx.state !== "running") {
      this.unlock();
    }
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: 880 Hz (A5)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn("[SoundManager] Chime error:", e);
    }
  }

  /**
   * Single bright bell for status advancement (e.g. ready for pickup): 1046.5Hz (C6)
   */
  public playOrderReadyBell() {
    if (!this.ctx || this.ctx.state !== "running") {
      this.unlock();
    }
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.5, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {
      console.warn("[SoundManager] Bell error:", e);
    }
  }
}

export const soundManager = new SoundManager();
