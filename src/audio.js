import { pickVoice } from './voice.js';

export function createAudio({ manifest, speech, makeAudio, getPrefs }) {
  let current = null;
  let release = null;
  let epoch = 0;

  // Faux seulement si l'appareil liste des voix et qu'aucune ne parle cette langue.
  function hasVoice(lang) {
    if (!speech || typeof speech.getVoices !== 'function') return true;
    const voices = speech.getVoices();
    if (!voices || voices.length === 0) return true;
    const base = lang.slice(0, 2).toLowerCase();
    return voices.some((v) => (v.lang || '').toLowerCase().startsWith(base));
  }

  async function playFile(src, rate) {
    const el = makeAudio(src);
    current = el;
    el.playbackRate = rate;
    await el.play();
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 30000); // flux bloqué : on ne fige pas la séance
      const done = () => { clearTimeout(timer); release = null; resolve(); };
      release = done;
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
    });
  }

  function say(text, lang, rate) {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      const prefs = (getPrefs && getPrefs()) || {};
      const english = lang.toLowerCase().startsWith('en');
      if (english && prefs.accent === 'GB') u.lang = 'en-GB';
      if (typeof speech.getVoices === 'function') {
        const voice = pickVoice(speech.getVoices(), lang, prefs.accent, english ? prefs.enName : prefs.frName);
        if (voice) { u.voice = voice; if (voice.lang) u.lang = voice.lang.replace('_', '-'); }
      }
      const timer = setTimeout(resolve, Math.max(3000, (text.length * 150) / rate));
      const done = () => { clearTimeout(timer); resolve(); };
      u.onend = done;
      u.onerror = done;
      speech.speak(u);
    });
  }

  return {
    async speak(key, text, lang, rate) {
      // Un seul son à la fois : on coupe ce qui joue déjà (sans invalider l'appel en cours).
      if (release) release();
      if (current) { try { current.pause(); } catch {} current = null; }
      if (speech) speech.cancel();
      const mine = epoch;
      if (manifest && manifest[key]) {
        try {
          await playFile(manifest[key], rate);
          return 'file';
        } catch {
          if (mine !== epoch) return 'none'; // arrêté pendant le chargement : ne pas lire l'ancien texte
        }
      }
      if (mine !== epoch) return 'none';
      if (speech && hasVoice(lang)) {
        await say(text, lang, rate);
        return 'speech';
      }
      return 'none';
    },
    stop() {
      epoch++;
      if (release) release();
      if (current) { try { current.pause(); } catch {} current = null; }
      if (speech) speech.cancel();
    },
  };
}
