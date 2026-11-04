// Vérifie la prononciation des mp3 : ElevenLabs retranscrit chaque fichier, on compare au texte prévu.
// Usage : node --env-file=.env.local tools/check-audio.mjs --lang en --only word,forms [--limit N]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { buildJobs, onlyKinds, selectJobs } from './generate-audio.mjs';

const NUMBERS = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };

export function normalize(s) {
  return String(s).toLowerCase().replace(/[.,;:!?"«»()]/g, ' ').replace(/\s+/g, ' ').trim();
}
const spell = (s) => normalize(s).replace(/\b\d+\b/g, (n) => NUMBERS[n] || n);
export const sameText = (expected, heard) => spell(expected) === spell(heard);

function arg(name) { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; }

export async function transcribe(file, lang, key) {
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', lang === 'fr' ? 'fra' : 'eng');
  fd.append('file', new Blob([readFileSync(file)], { type: 'audio/mpeg' }), 'a.mp3');
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: fd });
  if (!res.ok) throw new Error(`STT ${res.status}`);
  return (await res.json()).text || '';
}

async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY est absente.');
  const read = (n) => JSON.parse(readFileSync(`data/${n}.json`, 'utf8'));
  const content = { vocab: read('vocab'), verbs: read('verbs'), expressions: read('expressions'), grammar: read('grammar') };
  const only = (arg('only') || '').split(',').filter(Boolean);
  const lang = arg('lang') || 'en';
  const jobs = selectJobs(onlyKinds(buildJobs(content), only), { lang }).filter((j) => existsSync(j.file)).slice(0, Number(arg('limit')) || Infinity);
  const bad = [];
  let n = 0;
  for (const j of jobs) {
    let heard;
    try { heard = await transcribe(j.file, lang, key); } catch (e) { console.error(`${j.key}: ${e.message}`); if (/40[123]|429/.test(e.message)) break; continue; }
    if (!sameText(j.text, heard)) bad.push({ key: j.key, expected: j.text, heard });
    if (++n % 50 === 0) console.log(`${n} / ${jobs.length}, ${bad.length} différents`);
  }
  writeFileSync(arg('out') || 'docs/check-audio.json', JSON.stringify(bad, null, 1));
  console.log(`Vérifiés : ${n}. Différents : ${bad.length}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
