import { icon } from './icons.js';
import { nearestRate, RATES } from '../listen-pace.js';
import { h, topbar, segmented } from './dom.js';
import { rankVoices, summarizeVoices } from '../voice.js';

const SAMPLE_EN = 'The weather is lovely today, so let\'s go for a walk.';
const SAMPLE_FR = 'Il fait très beau aujourd\'hui, allons nous promener.';

export function renderVoiceSettings(root, ctx) {
  const speech = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const body = h('div', { class: 'm-listen stack' });
  root.append(topbar('Voix et vitesse', '#/me'), body);
  draw();
  if (speech) speech.addEventListener('voiceschanged', draw);
  // Sur iPhone la liste des voix arrive en retard et 'voiceschanged' n'est pas toujours émis : on relit plusieurs fois.
  const timers = [300, 800, 1600, 3000, 6000].map((ms) => setTimeout(draw, ms));

  const save = (patch) => { ctx.update((s) => ({ ...s, ...patch })); ctx.rate = ctx.state.rate; };
  const saveVoice = (patch) => { ctx.update((s) => ({ ...s, voice: { ...s.voice, ...patch } })); };

  async function test(lang, text) {
    ctx.audio.stop();
    const r = await ctx.audio.speak(`test:${lang}`, text, lang, ctx.state.rate || 1);
    if (r === 'none') alert('Aucune voix disponible pour cette langue sur cet appareil.');
  }

  function voiceSelect(id, label, lang, current, onchange) {
    const ranked = speech ? rankVoices(speech.getVoices(), lang, ctx.state.voice.accent) : [];
    return h('div', null,
      h('label', { class: 'field', for: id }, label),
      ranked.length
        ? h('select', { id, onchange: (e) => onchange(e.target.value || null) },
          h('option', { value: '', selected: !current }, `Automatique (${ranked[0].name})`),
          ranked.map((v, i) => h('option', { value: v.name, selected: v.name === current }, `${v.name}${i === 0 ? ' — recommandée' : ''}`)))
        : h('p', { class: 'muted small' }, 'Aucune voix de cette langue n\'est installée sur cet appareil.'));
  }

  function detected() {
    const info = summarizeVoices(speech ? speech.getVoices() : []);
    return h('div', { class: 'card stack' },
      h('h3', null, 'Voix détectées sur cet appareil'),
      h('p', { class: 'muted small', style: 'margin:0' }, `${info.total} voix détectées : ${info.en} en anglais, ${info.fr} en français.`),
      h('button', { class: 'btn secondary', onclick: draw }, 'Actualiser la liste'),
      info.all.length ? h('details', null, h('summary', null, 'Voir toutes les voix'),
        h('ul', { class: 'bullets', style: 'margin-top:10px' }, info.all.map((v) => h('li', null, `${v.name} (${v.lang})`)))) : null,
      h('p', { class: 'muted small', style: 'margin:0' }, 'Les voix Premium ou Optimisées téléchargées dans Réglages, Accessibilité, Contenu énoncé n\'apparaissent ici que si Safari les donne aux pages web. Si elles manquent dans cette liste, l\'app ne peut pas les utiliser.'));
  }

  function draw() {
    const s = ctx.state;
    body.replaceChildren(
      h('div', { class: 'card stack' },
        h('h3', null, 'Accent de l\'anglais'),
        segmented([['US', 'Américain', 'en-US'], ['GB', 'Britannique', 'en-GB']], s.voice.accent, (v) => { saveVoice({ accent: v, enName: null }); draw(); }),
        voiceSelect('envoice', 'Voix anglaise', 'en-US', s.voice.enName, (v) => saveVoice({ enName: v })),
        h('button', { class: 'btn', onclick: () => test('en-US', SAMPLE_EN) }, icon('play', 16), ' Essayer en anglais')),
      h('div', { class: 'card stack' },
        h('h3', null, 'Voix française'),
        voiceSelect('frvoice', 'Voix française', 'fr-FR', s.voice.frName, (v) => saveVoice({ frName: v })),
        h('button', { class: 'btn', onclick: () => test('fr-FR', SAMPLE_FR) }, icon('play', 16), ' Essayer en français')),
      h('div', { class: 'card stack' },
        h('h3', null, 'Vitesse de lecture'),
        h('select', { id: 'rate', 'aria-label': 'Vitesse de lecture', onchange: (e) => { save({ rate: Number(e.target.value) }); } },
          RATES.map((r) => h('option', { value: r, selected: r === nearestRate(s.rate) }, `${String(r).replace('.', ',')}×${r === 1 ? ' (normale)' : ''}`)))),
      detected(),
      h('div', { class: 'banner' },
        'Les voix viennent de ton appareil. Pour des voix plus naturelles, les fichiers audio ElevenLabs sont utilisés automatiquement s\'ils sont générés (voir tools/generate-audio.mjs).'));
  }

  return () => { timers.forEach(clearTimeout); if (speech) speech.removeEventListener('voiceschanged', draw); ctx.audio.stop(); };
}
