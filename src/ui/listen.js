import { h, sleep, shuffled, topbar, segmented, progressBar, scrollBehavior, LEVELS } from './dom.js';
import { buildStepsFor } from '../listen-steps.js';
import { gapMs, itemGapMs, guessMs, nearestRate, PACES } from '../listen-pace.js';
import { buildPool, SOURCES } from '../listen-pool.js';
import { createKeeper } from './keepalive.js';
import { icon } from './icons.js';
import { wordSheet } from './sheet.js';

const MODES = [['en-first', 'Anglais d\'abord', 'mot → sens'], ['fr-first', 'Français d\'abord', 'sens → mot']];
const MODE_HELP = {
  'en-first': 'Tu entends le mot anglais, puis sa traduction, les définitions, des exemples traduits et la construction.',
  'fr-first': 'Tu entends le mot français et la définition en anglais, tu devines le mot (4 secondes), puis la réponse et la suite.',
};

const KINDS = { irregular: 'Verbe irrégulier', regular: 'Verbe régulier', grammar: 'Grammaire' };

let remembered = { mode: 'en-first', source: 'vocab', loop: true, shuffle: true, count: 20, awake: false, pace: 'normal' };

export function renderListen(root, ctx) {
  const opts = { ...remembered, topic: 'all', level: 'all', rate: nearestRate(ctx.state.rate || 1) };
  const preset = location.hash.split('/')[2];
  if (SOURCES.some(([k]) => k === preset)) opts.source = preset;
  let session = null;
  const keeper = createKeeper();

  root.append(topbar('Écouter'));
  const body = h('div', { class: 'm-listen' });
  root.append(body);
  showSetup();

  function pool() {
    return buildPool(ctx.content, opts.source, opts);
  }

  function remember() { remembered = { mode: opts.mode, source: opts.source, loop: opts.loop, shuffle: opts.shuffle, count: opts.count, awake: opts.awake, pace: opts.pace }; }

  function select(id, label, options, value, onchange) {
    const sel = h('select', { id, onchange: (e) => onchange(e.target.value) },
      options.map(([v, t]) => h('option', { value: v, selected: v === String(value) }, t)));
    return h('div', null, h('label', { class: 'field', for: id }, label), sel);
  }

  function showSetup() {
    stopSession();
    body.replaceChildren();
    const topics = [...new Set(buildPool(ctx.content, opts.source).map((e) => e.topic))];
    if (opts.topic !== 'all' && !topics.includes(opts.topic)) opts.topic = 'all';
    const available = pool().length;
    body.append(
      h('div', { class: 'card stack' },
        h('h3', { style: 'margin:0' }, 'Dans quel sens ?'),
        segmented(MODES, opts.mode, (v) => { opts.mode = v; remember(); showSetup(); }),
        h('p', { class: 'muted small', style: 'margin:0' }, MODE_HELP[opts.mode])),
      h('div', { class: 'card stack' },
        select('src', 'Contenu', SOURCES, opts.source, (v) => { opts.source = v; opts.topic = 'all'; remember(); showSetup(); }),
        select('topic', 'Thème', [['all', 'Tous les thèmes'], ...topics.map((t) => [t, t])], opts.topic, (v) => { opts.topic = v; showSetup(); }),
        select('lvl', 'Niveau', [['all', 'Tous les niveaux'], ...LEVELS.map((l) => [l, l])], opts.level, (v) => { opts.level = v; showSetup(); }),
        select('count', 'Nombre d\'éléments', [['10', '10'], ['20', '20'], ['50', '50'], ['9999', 'Tous']], opts.count, (v) => { opts.count = Number(v); remember(); showSetup(); }),
        select('rate', 'Vitesse de lecture', [['0.85', 'Posée (0,85×)'], ['1', 'Normale (1×)'], ['1.2', 'Rapide (1,2×)']], opts.rate, (v) => { opts.rate = Number(v); ctx.update((st) => ({ ...st, rate: opts.rate })); }),
        select('pace', 'Temps pour répéter', PACES, opts.pace, (v) => { opts.pace = v; remember(); }),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: opts.shuffle, onchange: (e) => { opts.shuffle = e.target.checked; remember(); } }), 'Ordre aléatoire'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: opts.loop, onchange: (e) => { opts.loop = e.target.checked; remember(); } }), 'Recommencer en boucle'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: opts.awake, onchange: (e) => { opts.awake = e.target.checked; remember(); } }), 'Garder l\'écran allumé'),
        h('p', { class: 'muted small', style: 'margin:0' }, 'Mode métro : lance, branche tes écouteurs et verrouille ton téléphone. Pause, suivant et précédent restent sur l\'écran de verrouillage.')),
      available === 0
        ? h('p', { class: 'muted' }, 'Aucun mot ne correspond à ce choix. Change le thème ou le niveau.')
        : h('button', { class: 'btn lg block start-btn', onclick: start }, icon('play', 18), ` Lancer (${Math.min(available, opts.count)} éléments)`));
  }

  function start() {
    const list = pool();
    const items = (opts.shuffle ? shuffled(list) : list).slice(0, opts.count);
    if (!items.length) return;
    ctx.rate = opts.rate;
    session = { items, i: 0, paused: false, gen: 0 };
    keeper.start({
      awake: opts.awake,
      onPlay: () => { if (session && session.paused) togglePause(); },
      onPause: () => { if (session && !session.paused) togglePause(); },
      onNext: () => jump(1),
      onPrev: () => jump(-1),
    });
    showPlayer();
    playCurrent();
  }

  function stopSession() {
    if (session) { session.gen++; session = null; }
    keeper.stop();
    ctx.audio.stop();
  }

  let ui = null;
  function showPlayer() {
    body.replaceChildren();
    const counter = h('span', { class: 'muted small', 'aria-live': 'off' });
    const bar = h('div');
    const lines = h('div', { class: 'listen-lines' });
    const art = h('div', { class: 'np' },
      h('div', { class: 'np-kind' }), h('div', { class: 'np-word' }), h('div', { class: 'np-sub' }));
    const loopBtn = h('button', { class: 'icon-btn', 'aria-label': 'Boucle', 'aria-pressed': String(opts.loop),
      onclick: () => { opts.loop = !opts.loop; remember(); loopBtn.setAttribute('aria-pressed', String(opts.loop)); } }, icon('repeat', 22));
    const card = h('div', { class: 'card' }, lines);
    const fiche = h('details', { class: 'fiche card' }, h('summary', null, icon('file', 18), ' Fiche complète'));
    const note = h('p', { class: 'banner', hidden: true }, 'Aucune voix n\'est disponible pour cette langue sur cet appareil : le texte défile sans son.');
    const pauseBtn = h('button', { class: 'icon-btn xl', 'aria-label': 'Pause', onclick: togglePause }, icon('pause', 34));
    body.append(
      h('div', { class: 'row between' }, counter, h('button', { class: 'btn ghost', onclick: showSetup }, 'Terminer')),
      bar, note, art, card,
      h('div', { class: 'controls' },
        loopBtn,
        h('button', { class: 'icon-btn big', 'aria-label': 'Précédent', onclick: () => jump(-1) }, icon('prev', 26)),
        pauseBtn,
        h('button', { class: 'icon-btn big', 'aria-label': 'Suivant', onclick: () => jump(1) }, icon('next', 26)),
        h('span', { style: 'width:44px', 'aria-hidden': 'true' })),
      fiche);
    ui = { counter, bar, lines, fiche, note, pauseBtn, art };
  }

  function lineFor(step) {
    if (step.kind === 'pause') {
      const count = h('div', { class: 'count', 'aria-live': 'polite' });
      return { el: h('div', { class: 'line guess', 'data-id': step.id }, h('div', { class: 'label' }, step.label), h('div', null, 'Quel est le mot en anglais ?'), count), count };
    }
    return { el: h('div', { class: 'line', 'data-id': step.id },
      h('div', { class: 'label' }, step.label),
      h('div', { class: step.big ? 'word' : 't' }, step.show)) };
  }

  async function playCurrent() {
    if (!session) return;
    const s = session;
    const gen = ++s.gen;
    const item = s.items[s.i];
    const steps = buildStepsFor(item, opts.mode, { guessMs: guessMs(opts.pace) });
    keeper.meta(item.en || item.title_fr, item.fr || (item.type === 'grammar' ? 'Grammaire' : ''));
    keeper.state(true);
    ui.art.children[0].textContent = KINDS[item.type] || (item.id.startsWith('x-') ? 'Expression' : 'Mot');
    ui.art.children[1].textContent = item.en || item.title_fr;
    ui.art.children[2].textContent = item.fr || '';
    ui.counter.textContent = `${s.i + 1} / ${s.items.length}`;
    ui.bar.replaceChildren(progressBar(((s.i) / s.items.length) * 100, 'Séance'));
    ui.lines.replaceChildren();
    ui.fiche.open = false;
    ui.fiche.hidden = item.type === 'grammar';
    ui.fiche.replaceChildren(h('summary', null, icon('file', 18), ' Fiche complète'), item.type === 'grammar' ? null : wordSheet(ctx, item));
    ui.pauseBtn.replaceChildren(icon('pause', 34));
    ui.pauseBtn.setAttribute('aria-label', 'Pause');
    let prev = null;
    for (const step of steps) {
      if (gen !== s.gen) return;
      const { el, count } = lineFor(step);
      if (prev) { prev.classList.remove('active'); prev.classList.add('seen'); }
      el.classList.add('active');
      ui.lines.append(el);
      el.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
      if (step.kind === 'pause') {
        for (let t = Math.ceil(step.ms / 1000); t > 0; t--) {
          count.textContent = t;
          await sleep(1000);
          if (gen !== s.gen) return;
        }
        el.remove();
        continue;
      }
      prev = el;
      const t0 = Date.now();
      const r = await ctx.audio.speak(step.key, step.text, step.lang, opts.rate);
      const spoken = Date.now() - t0;
      if (gen !== s.gen) return;
      if (r === 'none') {
        ui.note.hidden = false;
        await sleep(2400 / opts.rate);
      } else if (r === 'speech' && step.lang === 'en-US') {
        ui.note.hidden = true;
      }
      await sleep(gapMs(step, spoken, opts.pace)); // temps de répéter dans sa tête ou à voix haute
      if (gen !== s.gen) return;
    }
    if (gen !== s.gen) return;
    if (prev) { prev.classList.remove('active'); prev.classList.add('seen'); }
    if (item.type !== 'grammar') ui.fiche.open = true;
    await sleep(itemGapMs(opts.pace));
    if (gen !== s.gen) return;
    if (s.i + 1 < s.items.length) { s.i++; playCurrent(); }
    else if (opts.loop) { s.i = 0; playCurrent(); }
    else finish();
  }

  function finish() {
    const n = session.items.length;
    session = null;
    keeper.stop();
    body.replaceChildren(h('div', { class: 'card empty stack' },
      h('div', { class: 'big-ico', 'aria-hidden': 'true' }, icon('sparkles', 44)),
      h('h2', null, 'Séance terminée'),
      h('p', { class: 'muted' }, `${n} éléments écoutés. Pour les retenir, passe aux cartes de révision.`),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('a', { class: 'btn m-cards', href: '#/cards' }, 'Réviser'),
        h('button', { class: 'btn secondary', onclick: showSetup }, 'Nouvelle séance'))));
  }

  function jump(d) {
    if (!session) return;
    const n = session.items.length;
    session.i = (session.i + d + n) % n;
    session.paused = false;
    ctx.audio.stop();
    playCurrent();
  }

  function togglePause() {
    if (!session) return;
    if (session.paused) {
      session.paused = false;
      keeper.state(true);
      playCurrent();
    } else {
      session.paused = true;
      session.gen++;
      ctx.audio.stop();
      keeper.state(false);
      ui.pauseBtn.replaceChildren(icon('play', 34));
      ui.pauseBtn.setAttribute('aria-label', 'Reprendre');
    }
  }

  return stopSession;
}
