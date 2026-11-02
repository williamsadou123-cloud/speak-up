# Application d'apprentissage de l'anglais — Design

Date : 2026-11-01

## 1. Objectif

Permettre à un francophone de progresser vite en anglais, à la lecture comme à l'écoute, avec une application plus complète qu'un dictionnaire ou que Duolingo : vocabulaire audio, verbes (réguliers et irréguliers, verbes d'action), expressions, mini-leçons de grammaire et exercices ludiques.

**Critère de réussite :** l'utilisateur lance une session, entend le mot anglais, sa définition en français et des phrases d'exemple sans toucher l'écran, puis révise ce qu'il a vu grâce à la répétition espacée, avec de courtes séances qui donnent envie de revenir.

## 2. Décisions

| Sujet | Décision |
|---|---|
| Plateforme | Application web (PWA), utilisable sur iPhone et Mac, installable sur l'écran d'accueil |
| Niveau | A1 à C1, test de placement au premier lancement ; contenu de départ centré sur B1-B2 |
| Serveur | Aucun. Contenu en JSON, progression dans `localStorage` |
| Voix | Voix du navigateur (Web Speech API) par défaut ; fichiers mp3 ElevenLabs préenregistrés quand ils existent |
| Clé ElevenLabs | Utilisée uniquement par un script local hors de l'app, jamais embarquée dans l'app |
| Langue de l'interface | Français |

**Écarté :** appel d'ElevenLabs en direct depuis l'app (clé exposée, coût à chaque écoute) ; génération du contenu par IA à la volée (serveur et clé requis, qualité variable).

## 3. Modules

1. **Mode écoute.** Une session lit, pour chaque entrée : le mot anglais, la définition en français, puis 2 à 3 phrases d'exemple. Sens inverse possible (mot français, définition anglaise). Vitesse réglable, boucle, lecture automatique mains libres, choix du thème et du niveau.
2. **Cartes à répétition espacée.** Algorithme de type SM-2 : chaque réponse (« raté », « difficile », « bien », « facile ») fixe la prochaine date de révision.
3. **Verbes.** Règles du -ed et du -ing pour les réguliers ; table des irréguliers (base, prétérit, participe passé) avec audio ; exercices de conjugaison par temps ; liste de verbes d'action avec exemples.
4. **Expressions.** Expressions idiomatiques, phrasal verbs et collocations, classés par thème.
5. **Exercices.** Choix multiples, saisie de la réponse, écouter puis écrire, phrase à compléter, mots à remettre dans l'ordre. Points d'expérience, série de jours consécutifs, objectif quotidien.
6. **Mini-leçons de grammaire.** Une idée par leçon, explication en français, exemples audio, exercices associés.
7. **Progression.** Mots appris, points faibles, série en cours, objectif du jour.

## 4. Architecture

Fichiers séparés, chacun avec une seule responsabilité :

- `data/` — contenu en JSON : `vocab.json`, `verbs.json`, `expressions.json`, `grammar.json`.
- `src/srs.js` — logique de répétition espacée (pure, sans accès au navigateur).
- `src/exercises.js` — génération des exercices à partir du contenu (pure).
- `src/audio.js` — lecture audio : cherche le mp3 d'une entrée, sinon utilise la synthèse vocale du navigateur.
- `src/store.js` — lecture et écriture de la progression dans `localStorage`.
- `src/ui/` — écrans : accueil, écoute, cartes, verbes, expressions, exercices, grammaire, progression.
- `tools/generate-audio.mjs` — script local qui lit le contenu et produit les mp3 via ElevenLabs.
- `audio/` — mp3 générés, nommés par identifiant d'entrée.
- `manifest.webmanifest` et `sw.js` — installation sur l'écran d'accueil et usage hors ligne.

## 5. Modèle de données

Chaque entrée de contenu a un `id` stable, un `level` (A1 à C1), un `topic`, `en`, `fr`, une `definition_fr`, une `definition_en` et une liste de `examples` (`en`, `fr`). Un verbe ajoute `type` (regular ou irregular), `past`, `pastParticiple` et `ing`.

La progression par entrée contient `ease`, `interval`, `due` et `reps`. S'y ajoutent les points d'expérience, la série, l'objectif quotidien et le niveau choisi.

## 6. Flux de données

Au lancement, l'app charge les JSON et la progression. Le mode écoute enchaîne les entrées par `audio.js`. Le mode cartes demande à `srs.js` les entrées dues, puis enregistre chaque réponse dans `store.js`. Les exercices sont construits par `exercises.js` à partir du contenu et du niveau, et leurs résultats mettent à jour la progression.

## 7. Gestion des erreurs

- Mp3 absent ou illisible : repli sur la synthèse vocale du navigateur.
- Aucune voix anglaise disponible : message clair, l'app reste utilisable en lecture.
- `localStorage` indisponible : l'app fonctionne pour la session en cours et prévient que la progression ne sera pas conservée.
- Contenu JSON invalide : l'entrée fautive est ignorée et signalée dans la console.

## 8. Tests

Tests automatiques pour `srs.js` (calcul des intervalles et des dates d'échéance) et `exercises.js` (exercices valides, bonne réponse toujours présente, pas de doublons). Vérification manuelle dans le navigateur pour l'interface et l'audio.

## 9. Contenu de départ

Environ 200 mots, 120 verbes (irréguliers inclus), 60 expressions et 8 leçons de grammaire, écrits pour cette première version et extensibles par ajout dans les fichiers JSON.

## 10. Hors périmètre de la première version

Comptes utilisateur, synchronisation entre appareils, reconnaissance vocale de la prononciation, application iOS native, génération de contenu par IA.
