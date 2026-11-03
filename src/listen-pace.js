// Rythme de l'écoute : temps laissé pour répéter à voix haute (fonctions pures).
export const PACES = [['short', 'Court'], ['normal', 'Normal'], ['long', 'Long']];
export const RATES = [0.85, 1, 1.2];

const MULT = { short: 0.8, normal: 1.4, long: 2.4 };
const ITEM_GAP = { short: 1500, normal: 2800, long: 4500 };
const GUESS = { short: 3000, normal: 5000, long: 7000 };
const m = (p) => MULT[p] || MULT.normal;

// Pause après une phrase : proportionnelle à sa durée (l'anglais se répète, le français moins).
export function gapMs(step, spokenMs, pace = 'normal') {
  const english = String(step.lang || '').toLowerCase().startsWith('en');
  const ms = spokenMs * m(pace) * (english ? 1 : 0.4);
  return Math.round(Math.min(12000, Math.max(english ? 1000 : 600, ms)));
}
export const itemGapMs = (pace = 'normal') => ITEM_GAP[pace] || ITEM_GAP.normal;
export const guessMs = (pace = 'normal') => GUESS[pace] || GUESS.normal;
export const nearestRate = (r) => RATES.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
