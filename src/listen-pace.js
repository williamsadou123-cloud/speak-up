// Rythme de l'écoute : temps laissé pour répéter à voix haute (fonctions pures).
// Une pause est soit automatique (proportionnelle à la phrase : short, normal, long), soit fixe (« fixed:N » = N secondes).
const FIXED = Array.from({ length: 10 }, (_, i) => i + 1);
export const PACES = [
  ['short', 'Auto, court'], ['normal', 'Auto, normal'], ['long', 'Auto, long'],
  ...FIXED.map((n) => [`fixed:${n}`, n === 1 ? '1 seconde' : `${n} secondes`]),
];
export const RATES = [0.7, 0.8, 0.85, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5];

const MULT = { short: 0.8, normal: 1.4, long: 2.4 };
const ITEM_GAP = { short: 1500, normal: 2800, long: 4500 };
const GUESS = { short: 3000, normal: 5000, long: 7000 };
const m = (p) => MULT[p] || MULT.normal;
const fixedSeconds = (p) => {
  const n = /^fixed:(\d+)$/.exec(String(p));
  return n ? Math.min(10, Math.max(1, Number(n[1]))) : null;
};

// Pause après une phrase : fixe, ou proportionnelle à sa durée (l'anglais se répète, le français moins).
export function gapMs(step, spokenMs, pace = 'normal') {
  const fixed = fixedSeconds(pace);
  if (fixed) return fixed * 1000;
  const english = String(step.lang || '').toLowerCase().startsWith('en');
  const ms = spokenMs * m(pace) * (english ? 1 : 0.4);
  return Math.round(Math.min(12000, Math.max(english ? 1000 : 600, ms)));
}
export function itemGapMs(pace = 'normal') {
  const fixed = fixedSeconds(pace);
  return fixed ? Math.max(1500, fixed * 1000) : ITEM_GAP[pace] || ITEM_GAP.normal;
}
export function guessMs(pace = 'normal') {
  const fixed = fixedSeconds(pace);
  return fixed ? Math.max(3000, fixed * 1000) : GUESS[pace] || GUESS.normal;
}
export const nearestRate = (r) => RATES.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
