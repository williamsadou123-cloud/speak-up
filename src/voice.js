// Choix de la voix de synthèse (fonctions pures).
const GOOD = /premium|enhanced|natural|neural|google/i;
// Voix « gadget » (macOS) : comprises, mais jamais recommandées.
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|princess|bouffon|bulles|cloches|murmure|orgue|mauvaises nouvelles|bonnes nouvelles|cordes|grenouille)\b/i;
const KNOWN = /\b(samantha|alex|daniel|karen|moira|tessa|serena|oliver|ava|allison|susan|thomas|am[eé]lie|audrey|aur[eé]lie|marie)\b/i;
const norm = (l) => String(l || '').replace('_', '-').toLowerCase();

export function rankVoices(voices, lang, accent) {
  const base = lang.slice(0, 2).toLowerCase();
  const wanted = lang.startsWith('en') ? (accent === 'GB' ? 'en-gb' : 'en-us') : norm(lang);
  return (voices || [])
    .filter((v) => norm(v.lang).startsWith(base))
    .map((v, i) => ({
      v, i,
      score: (GOOD.test(v.name) ? 100 : 0) + (KNOWN.test(v.name) ? 60 : 0) - (NOVELTY.test(v.name) ? 300 : 0)
        + (norm(v.lang) === wanted ? 50 : 0) + (v.localService ? 10 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.v);
}

export function pickVoice(voices, lang, accent, preferredName) {
  const ranked = rankVoices(voices, lang, accent);
  if (preferredName) {
    const hit = ranked.find((v) => v.name === preferredName);
    if (hit) return hit;
  }
  return ranked[0] || null;
}

// Ce que l'appareil expose réellement : sert à comprendre pourquoi une voix téléchargée n'apparaît pas.
export function summarizeVoices(voices) {
  const all = (voices || []).map((v) => ({ name: v.name, lang: norm(v.lang), local: !!v.localService }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const count = (base) => all.filter((v) => v.lang.startsWith(base)).length;
  return { total: all.length, en: count('en'), fr: count('fr'), all };
}
