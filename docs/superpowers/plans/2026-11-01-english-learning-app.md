# Application d'apprentissage de l'anglais — Plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une application web installable qui enseigne l'anglais par la lecture et l'écoute (mode écoute, cartes à répétition espacée, verbes, expressions, exercices, grammaire).

**Architecture:** JavaScript natif (modules ES), sans framework ni étape de build. Le contenu vit dans des JSON ; la logique pure (`srs`, `exercises`, `store`, `audio`) est testée avec `node:test` ; l'interface (`src/ui/`) l'appelle. L'audio lit un mp3 s'il existe, sinon la synthèse vocale du navigateur.

**Tech Stack:** HTML, CSS, JavaScript ES modules, `node:test` (Node 20+), service worker, Web Speech API, `python3 -m http.server` pour servir en local.

**Spec:** `docs/superpowers/specs/2026-11-01-english-learning-app-design.md`

## Global Constraints

- Plateforme : application web (PWA) utilisable sur iPhone et Mac, installable sur l'écran d'accueil.
- Niveaux A1 à C1, test de placement au premier lancement ; contenu de départ centré sur B1-B2.
- Aucun serveur : contenu en JSON, progression dans `localStorage`.
- Voix : Web Speech API par défaut ; mp3 ElevenLabs préenregistrés quand ils existent.
- La clé ElevenLabs n'est utilisée que par `tools/generate-audio.mjs` (lue dans la variable d'environnement `ELEVENLABS_API_KEY`), jamais dans l'app.
- Interface en français.
- Contenu de départ : environ 200 mots, 120 verbes (irréguliers inclus), 60 expressions, 8 leçons de grammaire.
- Chaque entrée : `id` stable, `level`, `topic`, `en`, `fr`, `definition_fr`, `definition_en`, `examples[{en, fr}]` ; un verbe ajoute `type` (`regular`|`irregular`), `past`, `pastParticiple`, `ing`.
- Progression par entrée : `ease`, `interval`, `due`, `reps` ; plus points d'expérience, série, objectif quotidien, niveau choisi.
- Réponses de révision : « raté » (`again`), « difficile » (`hard`), « bien » (`good`), « facile » (`easy`).
- Hors périmètre : comptes, synchronisation, reconnaissance de la prononciation, app iOS native, contenu généré par IA.

## Review Focus

- Mot sans mp3 ni voix anglaise disponible : l'écoute continue en affichant le texte et un message clair, sans planter.
- `localStorage` indisponible ou plein : l'app marche pour la session et prévient que la progression n'est pas conservée.
- Pool trop petit pour fabriquer 3 mauvaises réponses (niveau ou thème avec peu d'entrées) : l'exercice complète avec d'autres niveaux ou est omis, jamais de choix en double.
- Réponse saisie avec majuscules, espaces en trop, apostrophe typographique ou accents : acceptée si elle correspond.
- Aucune carte due ou contenu vide : écran « rien à réviser » au lieu d'un écran blanc.

---

## File Structure

- `package.json` — scripts `test` et `serve`.
- `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js` — coque PWA.
- `src/content.js` — chargement et validation des JSON.
- `src/srs.js`, `src/exercises.js`, `src/store.js`, `src/audio.js`, `src/placement.js` — logique pure.
- `src/ui/` — `app.js` (routeur), `home.js`, `listen.js`, `cards.js`, `verbs.js`, `expressions.js`, `exercises-view.js`, `grammar.js`, `progress.js`, `placement-view.js`.
- `data/vocab.json`, `data/verbs.json`, `data/expressions.json`, `data/grammar.json`.
- `tools/generate-audio.mjs`, `audio/manifest.json`.
- `tests/*.test.js`.

---

### Task 1: Squelette du projet et validation du contenu

**Files:**
- Create: `package.json`, `src/content.js`, `data/vocab.json` (3 entrées d'essai), `tests/content.test.js`

**Interfaces:**
- Produces: `validateEntry(entry: object, kind: 'vocab'|'verb'|'expression'): {ok: boolean, errors: string[]}` ; `loadContent(fetchFn: (url:string)=>Promise<{json():Promise<any>}>): Promise<{vocab, verbs, expressions, grammar}>` qui écarte les entrées invalides et les signale par `console.warn`.

- [ ] **Step 1: Écrire les tests** dans `tests/content.test.js` : `valid vocab entry passes`, `missing fr fails with "fr"` dans `errors`, `verb without pastParticiple fails`, `example without en fails`, `loadContent drops invalid entries and keeps valid ones` (fetch factice renvoyant une entrée valide et une invalide : 1 entrée gardée, un `console.warn` émis).
- [ ] **Step 2: Lancer** `git init && node --test tests/` — attendu : échec (module absent).
- [ ] **Step 3: Implémenter** `validateEntry` et `loadContent` dans `src/content.js` ; `package.json` avec `"type": "module"`, `"test": "node --test tests/"`, `"serve": "python3 -m http.server 8080"`.
- [ ] **Step 4: Lancer** `npm test` — attendu : tous les tests passent.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: project skeleton and content validation"`

### Task 2: Répétition espacée

**Files:**
- Create: `src/srs.js`, `tests/srs.test.js`

**Interfaces:**
- Produces: `newCard(id: string, now: number): Card` avec `Card = {id, ease: 2.5, interval: 0, due: now, reps: 0}` ; `review(card: Card, grade: 'again'|'hard'|'good'|'easy', now: number): Card` ; `dueCards(cards: Card[], now: number): Card[]` triées par `due` croissant. `interval` en jours, `due` en millisecondes.

- [ ] **Step 1: Écrire les tests** : `new card starts at ease 2.5, reps 0`, `good on first review gives interval 1 day`, `good on second review gives interval 3 days`, `good afterwards multiplies interval by ease`, `again resets reps to 0, lowers ease by 0.2 and is due in 10 minutes`, `ease never goes below 1.3`, `hard lowers ease by 0.15 and multiplies interval by 1.2 (min 1)`, `easy raises ease by 0.15 and multiplies interval by 1.3 over good`, `dueCards returns only cards with due <= now, sorted`, `review does not mutate its input`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec.
- [ ] **Step 3: Implémenter** `newCard`, `review`, `dueCards` (fonctions pures, retour d'un nouvel objet).
- [ ] **Step 4: Lancer** `npm test` — attendu : tous passent.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: spaced repetition scheduler"`

### Task 3: Générateur d'exercices

**Files:**
- Create: `src/exercises.js`, `tests/exercises.test.js`

**Interfaces:**
- Consumes: entrées validées (Task 1).
- Produces: `normalize(s: string): string` (minuscules, espaces compressés et rognés, apostrophes typographiques → `'`, accents retirés) ; `isCorrect(exercise, given: string): boolean` ; `makeExercise(type: 'choice'|'typing'|'listen'|'cloze'|'order', entry, pool: object[], rng: ()=>number): Exercise|null` avec `Exercise = {type, entryId, prompt, answer, choices?: string[], words?: string[], audioText?: string}` ; `buildSession(pool: object[], count: number, rng): Exercise[]`.

- [ ] **Step 1: Écrire les tests** : `normalize ignores case, extra spaces, curly apostrophes and accents` ; `choice has 4 distinct choices including the answer` ; `choice with pool too small for 3 distractors returns null` ; `typing accepts "  Hello " for "hello"` ; `cloze replaces the target word with ____ in the example` ; `order returns shuffled words that rejoin to the answer when sorted back` ; `listen has audioText and expects the English text` ; `buildSession returns up to count exercises with no null` ; `buildSession on an empty pool returns []`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec.
- [ ] **Step 3: Implémenter** les cinq types ; `rng` injecté pour des tests déterministes ; les mauvaises réponses viennent d'abord du même niveau, puis des autres niveaux.
- [ ] **Step 4: Lancer** `npm test` — attendu : tous passent.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: exercise generator"`

### Task 4: Stockage de la progression, points et série

**Files:**
- Create: `src/store.js`, `tests/store.test.js`

**Interfaces:**
- Produces: `createStore(storage: {getItem, setItem}|null): Store` avec `Store = {persistent: boolean, load(): State, save(state: State): void}` ; `State = {level: string|null, cards: Record<string, Card>, xp: number, streak: number, lastDay: string|null, dailyGoal: number, todayXp: number, todayDay: string|null}` ; `addXp(state: State, amount: number, today: string): State` ; `touchStreak(state: State, today: string): State` (`today` au format `YYYY-MM-DD`).

- [ ] **Step 1: Écrire les tests** : `load returns defaults when storage is empty` ; `save then load round-trips` ; `corrupted JSON falls back to defaults` ; `null storage gives persistent false and still works in memory` ; `setItem throwing sets persistent false without throwing` ; `touchStreak increments on consecutive day, keeps on same day, resets after a gap` ; `addXp resets todayXp on a new day`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec.
- [ ] **Step 3: Implémenter** avec clé `localStorage` `english-app-v1`.
- [ ] **Step 4: Lancer** `npm test` — attendu : tous passent.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: progress store with xp and streak"`

### Task 5: Couche audio

**Files:**
- Create: `src/audio.js`, `tests/audio.test.js`

**Interfaces:**
- Produces: `createAudio({manifest: Record<string,string>, speech: SpeechSynthesis|null, makeAudio: (src:string)=>HTMLAudioElement}): Audio` avec `Audio = {speak(key: string, text: string, lang: 'en-US'|'fr-FR', rate: number): Promise<'file'|'speech'|'none'>, stop(): void}`. `key` est de la forme `<entryId>:<partie>` où partie ∈ `word|def|ex0|ex1|ex2`.

- [ ] **Step 1: Écrire les tests** (doubles factices) : `plays the mp3 when the manifest has the key` ; `falls back to speech when the mp3 fails to play` ; `falls back to speech when the key is absent` ; `returns "none" and does not throw when there is no speech and no mp3` ; `rate is passed to speech` ; `stop cancels both audio and speech`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec.
- [ ] **Step 3: Implémenter** `createAudio`, chaque `speak` résolvant à la fin de la lecture.
- [ ] **Step 4: Lancer** `npm test` — attendu : tous passent.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: audio layer with mp3 and speech fallback"`

### Task 6: Contenu de départ

**Files:**
- Create/Modify: `data/vocab.json`, `data/verbs.json`, `data/expressions.json`, `data/grammar.json`, `tests/data.test.js`

**Interfaces:**
- Produces: `grammar.json` = liste de `{id, level, title_fr, explanation_fr, examples[{en, fr}], exercises[{prompt, answer, choices?}]}`.

- [ ] **Step 1: Écrire les tests** dans `tests/data.test.js` : `vocab has at least 200 entries, all valid` ; `verbs has at least 120 entries with at least 60 irregular, all valid` ; `expressions has at least 60 entries, all valid` ; `grammar has at least 8 lessons each with at least 3 exercises` ; `all ids are unique per file` ; `levels used are within A1..C1 and B1/B2 hold the majority of vocab` ; `every verb example contains the verb or one of its forms`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec (comptes insuffisants).
- [ ] **Step 3: Rédiger le contenu** par lots (vocabulaire par thème, verbes d'action et irréguliers, phrasal verbs et idiomes, leçons : present simple, present continuous, past simple, present perfect, futur, modaux, comparatifs, articles) jusqu'à ce que les tests passent.
- [ ] **Step 4: Lancer** `npm test` — attendu : tous passent.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: starter content"`

### Task 7: Coque de l'interface, accueil et mode écoute

**Files:**
- Create: `index.html`, `styles.css`, `src/ui/app.js`, `src/ui/home.js`, `src/ui/listen.js`, `src/placement.js`, `tests/placement.test.js`

**Interfaces:**
- Consumes: `loadContent`, `createStore`, `createAudio`, `review`/`dueCards`.
- Produces: `placementLevel(correct: number, total: number): 'A1'|'A2'|'B1'|'B2'|'C1'` ; routeur `navigate(route: string)` avec routes `home|listen|cards|verbs|expressions|exercises|grammar|progress|placement` ; `renderListen(root, ctx)` où `ctx = {content, store, audio, state}`.

- [ ] **Step 1: Écrire les tests** `placementLevel` : `0 correct gives A1`, `all correct gives C1`, `half gives B1`, `monotonic: more correct never gives a lower level`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec.
- [ ] **Step 3: Implémenter** `placementLevel`, puis l'écran d'accueil (objectif du jour, série, boutons des modules) et le mode écoute : choix du thème, du niveau, du sens EN→FR ou FR→EN, de la vitesse (0,7 / 1 / 1,2), boucle, lecture automatique ; enchaîne mot, définition, 2 à 3 exemples ; boutons pause et suivant ; texte toujours affiché ; message clair si aucune voix anglaise (`speak` renvoie `'none'`).
- [ ] **Step 4: Vérifier dans le navigateur** : `npm run serve`, ouvrir `http://localhost:8080`, lancer une session d'écoute, entendre mot, définition et exemples ; attendu : enchaînement sans clic, texte synchronisé, aucune erreur dans la console.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: app shell, home and listening mode"`

### Task 8: Cartes et exercices

**Files:**
- Create: `src/ui/cards.js`, `src/ui/exercises-view.js`

**Interfaces:**
- Consumes: `dueCards`, `review`, `newCard`, `buildSession`, `isCorrect`, `addXp`, `touchStreak`, `audio.speak`.
- Produces: `renderCards(root, ctx)`, `renderExercises(root, ctx)`.

- [ ] **Step 1: Implémenter les cartes** : recto (mot + bouton audio), verso (définition, exemples, audio), quatre boutons de réponse qui appellent `review` puis `store.save` ; nouvelles cartes limitées à 10 par séance ; écran « rien à réviser » quand aucune carte n'est due.
- [ ] **Step 2: Implémenter les exercices** : séance de 10 via `buildSession`, retour immédiat bon/mauvais avec la bonne réponse, +10 points par bonne réponse, mise à jour de la série, écran de fin avec score.
- [ ] **Step 3: Vérifier dans le navigateur** : faire une séance de cartes et une séance d'exercices ; attendu : les points et la série changent sur l'accueil, les cartes réapparaissent selon `due` après rechargement, aucune erreur console.
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat: spaced repetition cards and exercises UI"`

### Task 9: Verbes, expressions, grammaire et progression

**Files:**
- Create: `src/ui/verbs.js`, `src/ui/expressions.js`, `src/ui/grammar.js`, `src/ui/progress.js`

**Interfaces:**
- Consumes: contenu, `audio`, `buildSession`, `state`.
- Produces: `renderVerbs`, `renderExpressions`, `renderGrammar`, `renderProgress` (même signature `(root, ctx)`).

- [ ] **Step 1: Implémenter les verbes** : onglets réguliers (règles du -ed et du -ing, exemples), irréguliers (table base / prétérit / participe passé avec bouton audio par ligne, filtre par recherche), verbes d'action (liste avec exemples), exercice de conjugaison par temps.
- [ ] **Step 2: Implémenter les expressions** classées par thème, avec audio et exemples ; ajout d'une expression aux cartes.
- [ ] **Step 3: Implémenter la grammaire** : liste des 8 leçons, explication en français, exemples audio, exercices de la leçon.
- [ ] **Step 4: Implémenter la progression** : mots appris (cartes avec `reps >= 3`), points faibles (cartes à `ease` bas), série, objectif du jour.
- [ ] **Step 5: Vérifier dans le navigateur** : ouvrir chaque écran ; attendu : contenu affiché, audio sur chaque ligne, aucune erreur console.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: verbs, expressions, grammar and progress screens"`

### Task 10: Test de placement, PWA et hors ligne

**Files:**
- Create: `src/ui/placement-view.js`, `manifest.webmanifest`, `sw.js`
- Modify: `src/ui/app.js`, `index.html`

**Interfaces:**
- Consumes: `placementLevel`, `store`.

- [ ] **Step 1: Implémenter le test de placement** : 10 questions à choix tirées de tous les niveaux, au premier lancement (`state.level === null`), résultat via `placementLevel` enregistré dans `state.level`, modifiable ensuite depuis l'accueil.
- [ ] **Step 2: Ajouter** `manifest.webmanifest` (nom, icônes, `display: standalone`) et `sw.js` qui met en cache la coque, les JSON et les mp3 déjà lus.
- [ ] **Step 3: Vérifier dans le navigateur** : premier lancement avec stockage vidé affiche le test ; attendu : niveau enregistré, rechargement sans le test, et, hors ligne après un premier chargement, l'app s'ouvre encore.
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat: placement test, PWA manifest and offline cache"`

### Task 11: Génération des mp3 ElevenLabs

**Files:**
- Create: `tools/generate-audio.mjs`, `tests/generate-audio.test.js`, `audio/manifest.json`

**Interfaces:**
- Consumes: JSON de `data/`.
- Produces: `buildJobs(content): {key: string, text: string, lang: 'en'|'fr', file: string}[]` ; script exécuté par `ELEVENLABS_API_KEY=… node tools/generate-audio.mjs --voice-en <id> --voice-fr <id>` qui écrit `audio/<key>.mp3` et met à jour `audio/manifest.json`, en sautant les fichiers déjà présents.

- [ ] **Step 1: Écrire les tests** : `buildJobs yields word, def and example keys for each entry` ; `keys are unique` ; `jobs for existing files are skipped` ; `missing ELEVENLABS_API_KEY exits with a clear message and no request`.
- [ ] **Step 2: Lancer** `npm test` — attendu : échec.
- [ ] **Step 3: Implémenter** `buildJobs` et le script (appel HTTP de synthèse ElevenLabs avec la clé de l'environnement, reprise possible, pause entre les appels).
- [ ] **Step 4: Lancer** `npm test` — attendu : tous passent ; ne pas lancer de génération réelle sans que l'utilisateur ait fourni la clé.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: ElevenLabs audio generation script"`

### Task 12: Vérification finale

- [ ] **Step 1: Lancer** `npm test` — attendu : tous les tests passent.
- [ ] **Step 2: Parcourir tout le produit dans le navigateur**, sur largeur iPhone puis Mac : placement, écoute, cartes, exercices, verbes, expressions, grammaire, progression ; attendu : aucune erreur console, texte lisible, boutons utilisables au doigt.
- [ ] **Step 3: Tester les cas du Review Focus** : sans voix anglaise, avec `localStorage` bloqué, sans carte due, saisie avec majuscules et accents ; attendu : message clair ou comportement prévu, jamais d'écran blanc.
- [ ] **Step 4: Commit final** `git add -A && git commit -m "chore: final verification"`
