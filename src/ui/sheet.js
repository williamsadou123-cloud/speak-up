import { h, speakBtn } from './dom.js';
import { spokenText } from '../listen-steps.js';
import { newCard } from '../srs.js';

const EN = 'en-US';
const FR = 'fr-FR';

// « need + noun » → pastilles « need », « + », « noun ».
function patternChips(pattern) {
  return h('div', { class: 'pattern', 'aria-label': pattern },
    pattern.split(/(\s\+\s|\s→\s)/).map((part) =>
      /^\s[+→]\s$/.test(part) ? h('span', { class: 'plus', 'aria-hidden': 'true' }, part.trim()) : h('span', null, part.trim())));
}

const forms = (e) => [e.en, e.past, e.pastParticiple].join(', ');

// Fiche complète, ordre fixe : mot EN, mot FR, définition EN, définition FR, exemples (EN puis FR), construction.
export function wordSheet(ctx, entry) {
  const e = entry;
  const section = (title, ...children) => h('section', null, h('h3', { class: 'sec-title' }, title), ...children);
  return h('article', { class: 'sheet' },
    h('div', { class: 'head' },
      h('div', null,
        h('div', { class: 'word' }, e.en),
        e.type === 'irregular' ? h('div', { class: 'forms' }, `${e.past} · ${e.pastParticiple}`) : null,
        h('div', { class: 'fr-word' }, e.fr)),
      h('div', { class: 'row', style: 'flex-wrap:nowrap' },
        h('span', { class: 'tag' }, e.level),
        speakBtn(ctx, `${e.id}:word`, e.en, EN, 'Écouter le mot', false),
        e.type === 'irregular' ? speakBtn(ctx, `${e.id}:forms`, spokenText(forms(e)), EN, 'Écouter les trois formes', false) : null)),
    section('Definition',
      h('div', { class: 'defn' }, h('div', null, e.definition_en), speakBtn(ctx, `${e.id}:defen`, e.definition_en, EN, 'Écouter la définition anglaise', false))),
    section('Définition',
      h('div', { class: 'defn' }, h('div', null, e.definition_fr), speakBtn(ctx, `${e.id}:def`, e.definition_fr, FR, 'Écouter la définition française', false))),
    e.literal_fr ? section('Mot à mot', h('p', { style: 'margin:0' }, e.literal_fr)) : null,
    e.usage_fr ? section('Quand l\'utiliser', h('p', { style: 'margin:0' }, e.usage_fr)) : null,
    section('Exemples',
      e.examples.slice(0, 3).map((ex, i) => h('div', { class: 'example' },
        speakBtn(ctx, `${e.id}:ex${i}`, ex.en, EN, 'Écouter la phrase', false),
        h('div', null, h('div', { class: 'en' }, ex.en), h('div', { class: 'fr' }, ex.fr))))),
    e.construction ? section('Comment c\'est construit',
      h('div', { class: 'build' },
        patternChips(e.construction.pattern),
        h('p', { style: 'margin:0' }, e.construction.tip_fr),
        h('div', { style: 'margin-top:8px' }, speakBtn(ctx, `${e.id}:con`, spokenText(e.construction.pattern), EN, 'Écouter le schéma', false)))) : null);
}

// Bouton « ajouter aux cartes » d'une entrée.
export function addToCardsBtn(ctx, entry) {
  const has = () => !!ctx.state.cards[entry.id];
  const btn = h('button', { class: 'btn secondary', type: 'button', disabled: has(), onclick: () => {
    ctx.update((s) => ({ ...s, cards: { ...s.cards, [entry.id]: s.cards[entry.id] || newCard(entry.id, Date.now()) } }));
    btn.textContent = '✓ Dans mes cartes';
    btn.disabled = true;
  } }, has() ? '✓ Dans mes cartes' : '+ Ajouter aux cartes');
  return btn;
}
