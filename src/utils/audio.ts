let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {
    // AudioContext not allowed or supported
  }
  return audioCtx;
}

/**
 * High-speed pleasant chime via Web Audio API (<10ms latency)
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two quick ascending micro-tones: 880Hz -> 1320Hz
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    // Fail silently if audio blocked
  }
}

/**
 * Fast Thai voice announcement: "สแกนขึ้นรถเรียบร้อย"
 * Specially tuned for rapid student throughput (rate 1.35x)
 */
export function speakFastSuccess(customText = 'สแกนขึ้นรถเรียบร้อย') {
  playSuccessChime();

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    // Cancel any previous utterance to avoid queue buildup
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(customText);
    utterance.lang = 'th-TH';
    // Fast speech rate so queue moves rapidly for hundreds of students
    utterance.rate = 1.35;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick a Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech errors
  }
}

/**
 * Device haptic vibration (on supported mobile devices)
 */
export function triggerVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([70, 30, 80]);
    } catch {
      // Ignore vibration error
    }
  }
}
