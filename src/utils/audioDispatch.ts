// Voice dispatch utility for Singapore PHV & Taxi Drivers using Web Speech API

export function speakDispatchAlert(text: string, enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing announcement

    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/\bPHV\b/g, 'P H V')
      .replace(/\bLTA\b/g, 'L T A')
      .replace(/\bEWL\b/g, 'East West Line')
      .replace(/\bCTE\b/g, 'C T E')
      .replace(/\bPIE\b/g, 'P I E')
      .replace(/\bAYE\b/g, 'A Y E')
      .replace(/\bECP\b/g, 'E C P')
      .replace(/\bMBS\b/g, 'Marina Bay Sands')
      .replace(/\bT(\d)\b/g, 'Terminal $1')
      .replace(/(\d+\.\d+)x/g, '$1 times surge');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; // Slightly brisk for driver alert
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.includes('en-SG') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export function stopVoiceDispatch() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
