/**
 * 鲁锦织机拟音合成器 (Procedural Wooden Loom Audio Synthesizer)
 * 基于 Web Audio API 纯代码实时物理建模合成老木织机“飞梭穿梭”与“踏板打纬”音效
 */

class LoomAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * 模拟飞梭滑过经线张力与筘框打纬声音 (Shuttle Glide + Reed Beat)
   */
  playShuttleBeat() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. 飞梭穿线沙沙声 (Filtered Pink Noise Burst)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(now);

    // 2. 实木筘框打纬敲击声 (Wooden Reed Clack)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    const clackGain = this.ctx.createGain();
    clackGain.gain.setValueAtTime(0.18, now + 0.04);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(clackGain);
    clackGain.connect(this.ctx.destination);
    osc.start(now + 0.04);
    osc.stop(now + 0.14);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { LoomAudio };
}
