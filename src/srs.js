const DAY = 86400000;
const MIN_EASE = 1.3;

export function newCard(id, now) {
  return { id, ease: 2.5, interval: 0, due: now, reps: 0 };
}

export function review(card, grade, now) {
  const c = { ...card };
  if (grade === 'again') {
    c.reps = 0;
    c.ease = Math.max(MIN_EASE, card.ease - 0.2);
    c.interval = 0;
    c.due = now + 10 * 60000;
    return c;
  }
  if (grade === 'hard') {
    c.ease = Math.max(MIN_EASE, card.ease - 0.15);
    c.interval = Math.max(1, Math.round(card.interval * 1.2));
  } else {
    if (grade === 'easy') c.ease = card.ease + 0.15;
    let base;
    if (card.reps === 0) base = 1;
    else if (card.reps === 1) base = 3;
    else base = card.interval * card.ease;
    const good = Math.round(base);
    c.interval = grade === 'easy' ? Math.max(good + 1, Math.round(base * 1.3)) : good;
  }
  c.reps = card.reps + 1;
  c.due = now + c.interval * DAY;
  return c;
}

export function dueCards(cards, now) {
  return cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
}
