// Refait des mp3 mal prononcés : essaie plusieurs variantes (graine, ponctuation) et garde la première
// que la reconnaissance vocale retranscrit comme le texte prévu.
// Usage : node --env-file=.env.local tools/fix-audio.mjs --voice-en <id> --keys vb-send:forms,v-sore:word
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { buildJobs, requestBody } from './generate-audio.mjs';
import { sameText, transcribe } from './check-audio.mjs';

// Variantes à tenter : même texte avec d'autres graines, puis chaque forme séparée par un point.
export function variants(text) {
  const spaced = text.includes(',') ? text.split(',').map((t) => t.trim()).join('. ') + '.' : null;
  const single = !/[\s,]/.test(text);
  const punct = single ? ['.', '!', '?'].flatMap((m) => [11, 22, 33].map((seed) => ({ text: `${text}${m}`, seed }))) : [];
  return [
    ...[11, 22, 33, 44].map((seed) => ({ text, seed })),
    ...punct,
    ...(spaced ? [11, 22, 33].map((seed) => ({ text: spaced, seed })) : []),
  ];
}

function arg(name) { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; }

async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY est absente.');
  const voices = { en: arg('voice-en'), fr: arg('voice-fr') };
  const wanted = new Set((arg('keys') || '').split(',').filter(Boolean));
  const read = (n) => JSON.parse(readFileSync(`data/${n}.json`, 'utf8'));
  const jobs = buildJobs({ vocab: read('vocab'), verbs: read('verbs'), expressions: read('expressions'), grammar: read('grammar') })
    .filter((j) => wanted.has(j.key));
  const failed = [];
  for (const job of jobs) {
    let fixed = false;
    for (const v of variants(job.text)) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voices[job.lang]}`, {
        method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ ...requestBody({ ...job, text: v.text }), seed: v.seed }),
      });
      if (!res.ok) { console.error(`${job.key}: ${res.status}`); if ([401, 402, 429].includes(res.status)) return; continue; }
      const tmp = `${job.file}.try`;
      writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      const heard = await transcribe(tmp, job.lang, key);
      if (sameText(job.text, heard)) { writeFileSync(job.file, readFileSync(tmp)); fixed = true; console.log(`OK ${job.key} (graine ${v.seed}) : ${heard}`); break; }
    }
    if (existsSync(`${job.file}.try`)) await import('node:fs').then((f) => f.unlinkSync(`${job.file}.try`));
    if (!fixed) { failed.push(job.key); console.log(`PAS RÉSOLU ${job.key}`); }
  }
  console.log(failed.length ? `Non résolus : ${failed.join(', ')}` : 'Tout est résolu.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
