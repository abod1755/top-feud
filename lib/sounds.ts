/**
 * Tiny Web Audio sound effects — fully synthesized, no asset files or network.
 * Must be triggered from a user gesture (e.g. form submit) so the AudioContext
 * can start. All calls are safe to no-op during SSR.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = 'sine',
  peak = 0.18,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Bright two-note "ding" for a correct answer. */
export function playCorrect() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 660, t, 0.12, 'sine', 0.2); // E5
  tone(ctx, 988, t + 0.1, 0.18, 'sine', 0.2); // B5
}

/** Low buzzer for a wrong answer. */
export function playWrong() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 160, t, 0.22, 'square', 0.14);
  tone(ctx, 120, t + 0.08, 0.22, 'square', 0.12);
}

/** Soft celebratory arpeggio for the end-of-game screen. */
export function playFinish() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  [523, 659, 784, 1046].forEach((f, i) => tone(ctx, f, t + i * 0.12, 0.22, 'triangle', 0.18));
}
