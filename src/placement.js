const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

export function placementLevel(correct, total) {
  if (!total) return 'B1';
  const r = correct / total;
  if (r < 0.2) return 'A1';
  if (r < 0.4) return 'A2';
  if (r < 0.6) return 'B1';
  if (r < 0.8) return 'B2';
  return 'C1';
}

export const LEVELS = ORDER;
