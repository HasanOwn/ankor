export interface SpeechOptions {
  language?: string;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

const DEFAULT_LANGUAGE = 'ko-KR';
const VOICE_WAIT_MS = 1500;

let activeRequest = 0;
let cancelVoiceWait: (() => void) | undefined;

function matchingVoice(voices: SpeechSynthesisVoice[], language: string) {
  const normalized = language.toLowerCase();
  const base = normalized.split('-')[0];
  return voices.find(voice => voice.lang.toLowerCase() === normalized)
    ?? voices.find(voice => voice.lang.toLowerCase().startsWith(`${base}-`));
}

export function cancelSpeech() {
  activeRequest += 1;
  cancelVoiceWait?.();
  cancelVoiceWait = undefined;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

async function waitForVoice(language: string, request: number): Promise<SpeechSynthesisVoice | undefined> {
  const synthesis = window.speechSynthesis;
  const voices = synthesis.getVoices();
  const immediate = matchingVoice(voices, language);
  if (immediate || voices.length > 0) return immediate;

  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synthesis.removeEventListener('voiceschanged', finish);
      window.clearTimeout(timeout);
      if (cancelVoiceWait === finish) cancelVoiceWait = undefined;
      resolve(request === activeRequest ? matchingVoice(synthesis.getVoices(), language) : undefined);
    };

    const timeout = window.setTimeout(finish, VOICE_WAIT_MS);
    cancelVoiceWait = finish;
    synthesis.addEventListener('voiceschanged', finish);
  });
}

/** Speak a term with the deck language, falling back to Korean for language-neutral decks. */
export async function speakText(text: string, options: SpeechOptions = {}): Promise<boolean> {
  const term = text.trim();
  if (!term) return false;
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    options.onError?.('Speech playback is not supported in this browser.');
    return false;
  }

  const synthesis = window.speechSynthesis;
  const language = options.language || DEFAULT_LANGUAGE;
  const request = ++activeRequest;
  cancelVoiceWait?.();
  cancelVoiceWait = undefined;
  // Cancel first so a previous card can never finish over the newly requested term.
  synthesis.cancel();

  const voice = await waitForVoice(language, request);
  if (request !== activeRequest) return false;

  const utterance = new SpeechSynthesisUtterance(term);
  utterance.lang = language;
  utterance.rate = options.rate ?? 0.9;
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    if (request === activeRequest) options.onStart?.();
  };
  utterance.onend = () => {
    if (request === activeRequest) options.onEnd?.();
  };
  utterance.onerror = event => {
    if (request !== activeRequest) return;
    options.onEnd?.();
    // Browsers report intentional cancellation as an error; it is not a playback failure.
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      options.onError?.('This word could not be played. Check your browser audio and speech voice settings.');
    }
  };

  try {
    synthesis.speak(utterance);
    return true;
  } catch {
    options.onEnd?.();
    options.onError?.('This word could not be played. Check your browser audio and speech voice settings.');
    return false;
  }
}
