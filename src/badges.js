// Badges à débloquer (fonction pure : l'état et la date du jour suffisent).
const dayNum = (s) => Date.UTC(...s.split('-').map((n, i) => (i === 1 ? n - 1 : +n))) / 86400000;

export function computeBadges(state, today) {
  const cards = Object.values(state.cards || {});
  const learned = cards.filter((c) => c.reps >= 3).length;
  const streak = state.lastDay && dayNum(today) - dayNum(state.lastDay) <= 1 ? state.streak : 0;
  const goalToday = state.todayDay === today && state.todayXp >= state.dailyGoal;
  const defs = [
    ['level', '🎯', 'Niveau trouvé', 'Faire le test de niveau', !!state.level],
    ['streak3', '🔥', '3 jours', '3 jours d\'affilée', streak >= 3],
    ['streak7', '🌟', '7 jours', '7 jours d\'affilée', streak >= 7],
    ['goal', '✅', 'Objectif', 'Atteindre l\'objectif du jour', goalToday],
    ['xp100', '⭐', '100 points', 'Gagner 100 points', state.xp >= 100],
    ['xp500', '💎', '500 points', 'Gagner 500 points', state.xp >= 500],
    ['cards10', '🃏', '10 cartes', 'Commencer 10 cartes', cards.length >= 10],
    ['cards50', '📚', '50 cartes', 'Commencer 50 cartes', cards.length >= 50],
    ['learned20', '🧠', '20 mots', 'Apprendre 20 mots', learned >= 20],
  ];
  return defs.map(([id, icon, label, hint, earned]) => ({ id, icon, label, hint, earned }));
}
