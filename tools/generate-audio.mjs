// Génère les mp3 ElevenLabs pour tout le contenu et remplit audio/manifest.json.
// Usage :
//   ELEVENLABS_API_KEY=... node tools/generate-audio.mjs --voice-en <id> --voice-fr <id> [--limit N] [--only word,fr,ex] [--dry-run]
// --force --lang fr --max-words 3 : régénère les fichiers français courts ; --only : ne génère que ces types (word, fr, def, defen, forms, ex, exfr, con, tip) ; --dry-run affiche le nombre de fichiers et de caractères.
// La clé n'est lue que dans l'environnement : elle n'est jamais écrite dans un fichier de l'app.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spokenText } from '../src/listen-steps.js';

const fileFor = (key) => `audio/${key.replace(':', '-')}.mp3`;

export function buildJobs(content) {
  const jobs = [];
  const add = (key, text, lang) => jobs.push({ key, text, lang, file: fileFor(key) });
  for (const list of [content.vocab, content.verbs, content.expressions]) {
    for (const e of list || []) {
      add(`${e.id}:word`, spokenText(e.en), 'en');
      add(`${e.id}:fr`, spokenText(e.fr, 'fr'), 'fr');
      add(`${e.id}:def`, spokenText(e.definition_fr, 'fr'), 'fr');
      add(`${e.id}:defen`, spokenText(e.definition_en), 'en');
      e.examples.slice(0, 3).forEach((ex, i) => {
        add(`${e.id}:ex${i}`, spokenText(ex.en), 'en');
        add(`${e.id}:ex${i}fr`, spokenText(ex.fr, 'fr'), 'fr');
      });
      if (e.type === 'irregular' || e.type === 'regular') add(`${e.id}:forms`, spokenText([e.en, e.past, e.pastParticiple].join(', ')), 'en');
      if (e.construction && e.construction.pattern) add(`${e.id}:con`, spokenText(e.construction.pattern), 'en');
      if (e.construction && e.construction.tip_fr) add(`${e.id}:tip`, spokenText(e.construction.tip_fr, 'fr'), 'fr');
    }
  }
  for (const g of content.grammar || []) {
    add(`${g.id}:title`, spokenText(g.title_fr, 'fr'), 'fr');
    (g.rule_fr || []).forEach((r, i) => add(`${g.id}:r${i}`, spokenText(r, 'fr'), 'fr'));
    g.examples.slice(0, 3).forEach((ex, i) => {
      add(`${g.id}:ex${i}`, spokenText(ex.en), 'en');
      add(`${g.id}:ex${i}fr`, spokenText(ex.fr, 'fr'), 'fr');
    });
  }
  return jobs;
}

// Type d'un fichier : « v-luggage:ex1fr » → « exfr », « v-luggage:ex0 » → « ex ».
export const kindOf = (key) => key.split(':')[1].replace(/^ex\d+(fr)?$/, (m) => (m.endsWith('fr') ? 'exfr' : 'ex'));
export const onlyKinds = (jobs, kinds) => (kinds && kinds.length ? jobs.filter((j) => kinds.includes(kindOf(j.key))) : jobs);

// Le français est forcé : sinon un mot isolé comme « logement » est deviné anglais et lu avec l'accent anglais.
export function requestBody(job) {
  return job.lang === 'fr'
    ? { text: job.text, model_id: 'eleven_turbo_v2_5', language_code: 'fr' }
    : { text: job.text, model_id: 'eleven_multilingual_v2' };
}

export function selectJobs(jobs, { lang, maxWords } = {}) {
  return jobs.filter((j) => (!lang || j.lang === lang) && (!maxWords || j.text.split(/\s+/).length <= maxWords));
}

// Reprise après changement de voix : un fichier est à refaire s'il manque ou date d'avant `cutoff` (ms).
export const isStale = (mtimeMs, cutoff) => mtimeMs == null || mtimeMs < cutoff;
export const shortestFirst = (jobs) => jobs.map((j, i) => [j, i]).sort((a, b) => a[0].text.length - b[0].text.length || a[1] - b[1]).map(([j]) => j);

export const pendingJobs = (jobs, exists) => jobs.filter((j) => !exists(j.file));

export function requireApiKey(env) {
  const key = env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error('ELEVENLABS_API_KEY est absente. Lance : ELEVENLABS_API_KEY=ta_clé node tools/generate-audio.mjs --voice-en <id> --voice-fr <id>');
  }
  return key;
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const key = dryRun ? null : requireApiKey(process.env);
  const voices = { en: arg('voice-en'), fr: arg('voice-fr') };
  if (!dryRun && (!voices.en || !voices.fr)) throw new Error('Indique --voice-en <id> et --voice-fr <id> (identifiants de voix ElevenLabs).');

  const read = (n) => JSON.parse(readFileSync(`data/${n}.json`, 'utf8'));
  const content = { vocab: read('vocab'), verbs: read('verbs'), expressions: read('expressions'), grammar: read('grammar') };
  const limit = Number(arg('limit')) || Infinity;
  const only = (arg('only') || '').split(',').filter(Boolean);
  const force = process.argv.includes('--force'); // régénère même si le fichier existe (avec --lang / --max-words)
  const picked = selectJobs(onlyKinds(buildJobs(content), only), { lang: arg('lang'), maxWords: Number(arg('max-words')) || 0 });
  const cutoff = Number(arg('stale-before')) || 0; // avec --force : ne refait pas ce qui a été refait après cette date
  const mtime = (f) => (existsSync(f) ? statSync(f).mtimeMs : null);
  const ordered = process.argv.includes('--short-first') ? shortestFirst(picked) : picked;
  const todo = (force ? ordered.filter((j) => isStale(mtime(j.file), cutoff)) : pendingJobs(ordered, existsSync)).slice(0, limit);
  const chars = todo.reduce((n, j) => n + j.text.length, 0);
  console.log(`${todo.length} fichiers à générer (${chars} caractères).`);
  if (dryRun) return;

  mkdirSync('audio', { recursive: true });
  const manifest = existsSync('audio/manifest.json') ? JSON.parse(readFileSync('audio/manifest.json', 'utf8')) : {};
  let done = 0;
  for (const job of todo) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voices[job.lang]}`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(requestBody(job)),
    });
    if (!res.ok) {
      console.error(`Échec ${res.status} pour ${job.key}`);
      if ([401, 402, 403, 429].includes(res.status)) break; // clé, quota ou limite : inutile d'insister
      continue;
    }
    writeFileSync(job.file, Buffer.from(await res.arrayBuffer()));
    manifest[job.key] = job.file;
    writeFileSync('audio/manifest.json', JSON.stringify(manifest, null, 1));
    done++;
    if (done % 25 === 0) console.log(`${done} / ${todo.length}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`Terminé : ${done} fichiers générés. Relance le script pour reprendre les manquants.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
