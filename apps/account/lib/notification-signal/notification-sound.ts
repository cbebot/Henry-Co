let audioContext: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  try {
    const BrowserAudioContext =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!BrowserAudioContext) return null;

    audioContext = new BrowserAudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

export async function unlockNotificationAudio() {
  const context = getAudioContext();
  if (!context) return false;

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    audioUnlocked = context.state === "running";
    return audioUnlocked;
  } catch {
    return false;
  }
}

export function isNotificationAudioUnlocked() {
  return audioUnlocked;
}

export async function playNotificationSound() {
  if (typeof window === "undefined" || !audioUnlocked) {
    return false;
  }

  const context = getAudioContext();
  if (!context || context.state !== "running") {
    return false;
  }

  try {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    overtone.type = "triangle";

    oscillator.frequency.setValueAtTime(784, now);
    oscillator.frequency.exponentialRampToValueAtTime(659.25, now + 0.18);
    overtone.frequency.setValueAtTime(523.25, now);
    overtone.frequency.exponentialRampToValueAtTime(440, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.009, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    oscillator.connect(gain);
    overtone.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 0.26);
    overtone.stop(now + 0.24);

    return true;
  } catch {
    return false;
  }
}

export async function testNotificationSound() {
  const unlocked = await unlockNotificationAudio();
  if (!unlocked) return false;

  return playNotificationSound();
}
