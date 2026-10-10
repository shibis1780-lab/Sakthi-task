import { VoiceSettings } from '../types';

// Web Audio API chime synthesis for offline alerts
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(type: 'success' | 'alert' | 'ding' = 'ding') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'success') {
      // Warm ascending two-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.12);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.6);
    } else if (type === 'alert') {
      // Energetic alert pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Ding chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('Audio chime could not play:', e);
  }
}

// Available voices cache
let cachedVoices: SpeechSynthesisVoice[] = [];

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    const handleVoicesChanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    // Timeout fallback
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 500);
  });
}

// Find the best Tamil or Indian English Male voice
export function findBestMaleVoice(voices: SpeechSynthesisVoice[], selectedVoiceURI?: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  if (selectedVoiceURI) {
    const found = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (found) return found;
  }

  // 1. Check for Tamil voices with male indicators
  const tamilMale = voices.find(
    (v) =>
      v.lang.startsWith('ta') &&
      (v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('valluvar') ||
        v.name.toLowerCase().includes('rishi') ||
        v.name.toLowerCase().includes('google tamil'))
  );
  if (tamilMale) return tamilMale;

  // 2. Check for any Tamil voice
  const anyTamil = voices.find((v) => v.lang.startsWith('ta'));
  if (anyTamil) return anyTamil;

  // 3. Check for Indian English Male voices
  const enInMale = voices.find(
    (v) =>
      v.lang.includes('IN') &&
      (v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('rishi') ||
        v.name.toLowerCase().includes('prabhat') ||
        v.name.toLowerCase().includes('ravi') ||
        v.name.toLowerCase().includes('google'))
  );
  if (enInMale) return enInMale;

  // 4. Any Indian English voice
  const anyEnIn = voices.find((v) => v.lang.includes('IN'));
  if (anyEnIn) return anyEnIn;

  // 5. Any male voice in English
  const anyMaleEn = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('guy') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('george'))
  );
  if (anyMaleEn) return anyMaleEn;

  return voices[0] || null;
}

// Speak in Sakthi's resonant Tamil male voice
export function speakThanglish(
  text: string,
  settings: VoiceSettings,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Normalize Thanglish text for clearer pronunciation
  const phoneticText = text
    .replace(/\bvanakkam\b/gi, 'Vannakkam')
    .replace(/\bthalaiva\b/gi, 'Thalaivaa')
    .replace(/\bnaalaki\b/gi, 'Naalaikku')
    .replace(/\bnalaki\b/gi, 'Naalaikku')
    .replace(/\bkaalaila\b/gi, 'Kaalaiyila')
    .replace(/\bveetuku\b/gi, 'Veettukku')
    .replace(/\bmukkiyam\b/gi, 'Mukkiyam');

  const utterance = new SpeechSynthesisUtterance(phoneticText);

  // Settings
  utterance.pitch = settings.pitch || 0.88; // Lower pitch creates deep male resonance
  utterance.rate = settings.rate || 0.96;
  utterance.volume = settings.volume ?? 1;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = findBestMaleVoice(voices, settings.voiceURI);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    onEnd?.();
  };
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Web Speech Recognition wrapper
export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export function createSpeechRecognizer(
  lang: 'ta-IN' | 'en-IN' = 'en-IN',
  handlers: SpeechRecognitionResultHandler
): { start: () => void; stop: () => void; isSupported: boolean } {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognitionClass =
    (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang; // 'ta-IN' for Tamil or 'en-IN' for Thanglish

  recognition.onstart = () => {
    handlers.onStart();
  };

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      handlers.onResult(finalTranscript, true);
    } else if (interimTranscript) {
      handlers.onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    handlers.onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    handlers.onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition already started or error:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        // Ignored
      }
    },
    isSupported: true,
  };
}
