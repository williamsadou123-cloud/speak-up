const KEY = 'english-app-v1';

export const defaultState = () => defaults();

const defaults = () => ({
  level: null, cards: {}, xp: 0, streak: 0, lastDay: null,
  dailyGoal: 50, todayXp: 0, todayDay: null,
  voice: { accent: 'US', enName: null, frName: null }, rate: 1,
});

export function createStore(storage) {
  let memory = defaults();
  const store = {
    persistent: !!storage,
    load() {
      if (!storage) return structuredClone(memory);
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return defaults();
        const saved = JSON.parse(raw);
        const d = defaults();
        return { ...d, ...saved, voice: { ...d.voice, ...(saved.voice || {}) } };
      } catch {
        return defaults();
      }
    },
    save(state) {
      memory = structuredClone(state);
      if (!storage) return;
      try {
        storage.setItem(KEY, JSON.stringify(state));
      } catch {
        store.persistent = false;
      }
    },
  };
  return store;
}

const dayNum = (s) => Date.UTC(...s.split('-').map((n, i) => (i === 1 ? n - 1 : +n))) / 86400000;

export function touchStreak(state, today) {
  if (state.lastDay === today) return state;
  const consecutive = state.lastDay && dayNum(today) - dayNum(state.lastDay) === 1;
  return { ...state, streak: consecutive ? state.streak + 1 : 1, lastDay: today };
}

export function addXp(state, amount, today) {
  const todayXp = state.todayDay === today ? state.todayXp + amount : amount;
  return { ...state, xp: state.xp + amount, todayXp, todayDay: today };
}
