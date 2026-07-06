/**
 * sound.js
 * ------------------------------------------------------------------
 * صوت اصطدام الكرات: يجمع بين طقّة ضوضاء مُرشَّحة (bandpass) تحاكي
 * الاحتكاك المعدني اللحظي، ونغمة قصيرة سريعة التلاشي تحاكي رنين
 * الفولاذ. تتناسب شدة الصوت مع سرعة الاصطدام الفعلية القادمة من
 * محرك الفيزياء بدلاً من أن تكون ثابتة، فتبدو الضربات القوية أعلى
 * والضربات الخفيفة أهدأ — كما في الجهاز الحقيقي.
 * ------------------------------------------------------------------
 */

let audioCtx = null;
let lastSoundTime = 0;
const SOUND_COOLDOWN = 0.045; // Minimum time between sounds (seconds)

function getAudioContext() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") {
    // Needed for Chrome's autoplay policy
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a metallic collision click.
 * @param {number} intensity - roughly the closing angular speed of the
 *   collision (state.lastCollisionIntensity). Higher = louder & brighter.
 */
export function playCollisionSound(intensity = 1) {
  const toggle = document.getElementById("soundToggle");
  if (!toggle || !toggle.checked) return;

  const now = performance.now() / 1000;
  if (now - lastSoundTime < SOUND_COOLDOWN) return;
  lastSoundTime = now;

  try {
    const ctx = getAudioContext();
    const t0 = ctx.currentTime;

    // Clamp so silence/near-zero contacts don't get amplified, and hard
    // hits don't clip.
    const amt = Math.min(Math.max(intensity, 0.2), 1.6);

    /* ---- Transient: filtered noise burst = the "click" ---- */
    const noiseDuration = 0.028;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * noiseDuration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Decaying white noise
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 2400 + Math.random() * 900;
    noiseFilter.Q.value = 1.1;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * amt, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + noiseDuration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    /* ---- Body: short metallic tone = the "clack" ring ---- */
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";

    const baseFreq = 1150 + Math.random() * 350;
    osc.frequency.setValueAtTime(baseFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.32, t0 + 0.09);

    oscGain.gain.setValueAtTime(0.2 * amt, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    /* ---- A second, higher partial for a bit of metallic shimmer ---- */
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(baseFreq * 2.1, t0);
    osc2Gain.gain.setValueAtTime(0.07 * amt, t0);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    osc2.connect(osc2Gain);
    osc2Gain.connect(ctx.destination);

    noise.start(t0);
    noise.stop(t0 + noiseDuration);
    osc.start(t0);
    osc.stop(t0 + 0.12);
    osc2.start(t0);
    osc2.stop(t0 + 0.06);
  } catch (err) {
    /* audio unavailable — fail silently */
  }
}