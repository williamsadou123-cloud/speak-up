import { LEVELS } from '../placement.js';

export { LEVELS };

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function allEntries(content) {
  return [
    ...content.vocab.map((e) => ({ ...e, kind: 'vocab' })),
    ...content.verbs.map((e) => ({ ...e, kind: 'verb' })),
    ...content.expressions.map((e) => ({ ...e, kind: 'expression' })),
  ];
}

// Niveaux proches de celui de l'utilisateur : un cran en dessous, le sien, un cran au-dessus.
export function levelBand(level) {
  const i = LEVELS.indexOf(level);
  if (i < 0) return LEVELS;
  return LEVELS.slice(Math.max(0, i - 1), i + 2);
}

// `back` : lien de retour (null = pas de bouton, pour les écrans d'onglet).
export function topbar(title, back = '#/learn') {
  return h('header', { class: 'topbar' },
    back ? h('a', { class: 'back', href: back, 'aria-label': 'Retour' }, '←') : null,
    h('h1', null, title));
}

export function progressBar(pct, label = 'Progression') {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return h('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100 },
    h('i', { style: `width:${v}%` }));
}

// Un bouton par option ; `onpick(value)` est appelé au clic.
export function segmented(options, value, onpick) {
  return h('div', { class: 'seg', role: 'group' }, options.map(([v, label, sub]) =>
    h('button', { type: 'button', class: v === value ? 'on' : '', 'aria-pressed': v === value, onclick: () => onpick(v) },
      label, sub ? h('small', null, sub) : null)));
}

export function banner(ctx) {
  return ctx.store.persistent
    ? null
    : h('div', { class: 'banner', role: 'status' },
      'Ta progression ne sera pas conservée : le stockage du navigateur est indisponible.');
}

export function speakBtn(ctx, key, text, lang = 'en-US', label = 'Écouter', showText = true) {
  return h('button', {
    class: 'icon-btn', type: 'button', 'aria-label': showText ? `${label} : ${text}` : label,
    onclick: async (e) => {
      const b = e.currentTarget;
      ctx.audio.stop();
      const r = await ctx.audio.speak(key, text, lang, ctx.rate || 1);
      if (r === 'none') b.title = 'Aucune voix disponible sur cet appareil';
    },
  }, '🔊');
}

export function paragraphs(text) {
  return text.split('\n').map((p) => h('p', null, p));
}

// Défilement doux, sauf si l'utilisateur a demandé moins d'animations.
export function scrollBehavior() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
