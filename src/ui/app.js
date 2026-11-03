import { loadContent } from '../content.js';
import { createStore } from '../store.js';
import { createAudio } from '../audio.js';
import { createSharedPlayer } from '../shared-audio.js';
import { h, banner } from './dom.js';
import { renderHome } from './home.js';
import { renderListen } from './listen.js';
import { renderCards } from './cards.js';
import { renderExercises } from './exercises-view.js';
import { renderVerbs } from './verbs.js';
import { renderExpressions } from './expressions.js';
import { renderGrammar } from './grammar.js';
import { renderMe } from './me.js';
import { renderPlacement } from './placement-view.js';
import { renderLearnHub } from './learn-hub.js';
import { renderVocab } from './vocab.js';
import { renderVoiceSettings } from './voice-settings.js';
import { renderNav, TAB_OF } from './nav.js';
import { allEntries } from './dom.js';
import { dueCards } from '../srs.js';

const routes = {
  home: renderHome, learn: renderLearnHub, listen: renderListen, vocab: renderVocab, cards: renderCards, verbs: renderVerbs,
  expressions: renderExpressions, exercises: renderExercises, grammar: renderGrammar,
  me: renderMe, progress: renderMe, voice: renderVoiceSettings, placement: renderPlacement,
};

async function fetchOk(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res;
}

async function boot() {
  const root = document.getElementById('app');
  try {
    let storage = null;
    try { storage = window.localStorage; storage.getItem('probe'); } catch { storage = null; }
    const store = createStore(storage);

    let manifest = {};
    try { manifest = await (await fetchOk('audio/manifest.json', { cache: 'no-cache' })).json(); } catch { /* pas encore de mp3 */ }

    const content = await loadContent(fetchOk);
    const ctx = {
      content, store, audio: null, rate: 1,
      state: store.load(),
      update(fn) { ctx.state = fn(ctx.state); store.save(ctx.state); },
      go(hash) { if (location.hash === hash) route(); else location.hash = hash; },
    };
    ctx.rate = ctx.state.rate || 1;
    const audio = createAudio({
      getPrefs: () => ctx.state.voice,
      manifest,
      speech: 'speechSynthesis' in window ? window.speechSynthesis : null,
      makeAudio: createSharedPlayer(new Audio()),
    });

    ctx.audio = audio;

    let cleanup = null;
    const route = () => {
      if (cleanup) { try { cleanup(); } catch { /* ignoré */ } cleanup = null; }
      audio.stop();
      let name = location.hash.replace(/^#\/?/, '').split('/')[0] || 'home';
      if (!routes[name]) name = 'home';
      if (ctx.state.level === null && name !== 'placement') name = 'placement';
      const main = h('main', { class: name === 'placement' ? '' : `screen-${name}` });
      const warn = banner(ctx);
      const known = new Set(allEntries(content).map((e) => e.id));
      const due = dueCards(Object.values(ctx.state.cards), Date.now()).filter((c) => known.has(c.id)).length;
      root.replaceChildren(...[warn, main, name === 'placement' ? null : renderNav(TAB_OF[name], due)].filter(Boolean));
      cleanup = routes[name](main, ctx) || null;
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', route);
    route();

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  } catch (err) {
    console.error(err);
    root.replaceChildren(h('div', { class: 'card' },
      h('h2', null, 'Oups, l\'application ne démarre pas'),
      h('p', null, 'Les fichiers de contenu n\'ont pas pu être chargés. Vérifie ta connexion puis recharge la page.'),
      h('button', { class: 'btn', onclick: () => location.reload() }, 'Recharger')));
  }
}

boot();
