# Refonte de l'application — Design

Date : 2026-11-01. Complète `2026-11-01-english-learning-app-design.md` ; en cas de conflit, ce document prévaut.

## 1. Objectif

Rendre l'application plus belle, plus intuitive et plus pédagogique : chaque mot a une **fiche complète** (mot anglais et français, définition anglaise et française, exemples traduits, construction de la phrase), l'écoute existe en **deux versions**, et la révision, les exercices, les verbes irréguliers, la grammaire, les expressions et les voix sont repensés.

**Critère de réussite :** un apprenant francophone lance l'écoute en « anglais d'abord » ou en « français d'abord », entend la fiche complète d'un mot sans rien toucher, puis révise et s'exerce avec des écrans simples (une action principale par écran), dans une interface qu'il a envie d'ouvrir.

## 2. Décisions

| Sujet | Décision |
|---|---|
| Fiche d'un mot | Ordre fixe : mot EN (audio), mot FR, définition EN, définition FR, 2 à 3 exemples (EN avec audio, puis FR), « Comment c'est construit » |
| Écoute | Deux modes : `en-first` et `fr-first` ; `fr-first` insère une pause de devinette avant la révélation du mot anglais |
| Construction | Champ `construction` par entrée : `{pattern, tip_fr}` (schéma de phrase et conseil d'emploi en français), pour les ~420 entrées |
| Exemples | Au moins 2 par entrée (les 146 verbes passent de 1 à 2) |
| Navigation | Barre d'onglets en bas : Accueil, Apprendre, Réviser, Pratiquer, Moi |
| Thème | Clair par défaut, sombre automatique selon l'appareil ; une couleur d'accent par type de contenu |
| Révision | Carte qui se retourne ; 3 boutons visibles : « À revoir » (`again`), « Bien » (`good`), « Facile » (`easy`) ; `hard` reste dans `srs.js` mais n'est plus proposé |
| Exercices | Une question par écran, choix par défaut, saisie optionnelle ; explication affichée après chaque réponse |
| Voix | Réglages d'accent (américain / britannique), choix automatique de la meilleure voix, vitesse, bouton d'essai ; circuit mp3 ElevenLabs conservé |

## 3. Écoute

Les étapes sont produites par une fonction pure `buildSteps(item, mode, options)` dans `src/listen-steps.js`.

- `en-first` : mot EN, mot FR, définition EN, définition FR, puis pour chaque exemple : phrase EN, traduction FR ; enfin la construction (schéma, conseil).
- `fr-first` : mot FR, définition EN, **pause de 4 s** (devinette), mot EN, définition FR, puis les exemples et la construction comme ci-dessus.
- Options conservées : thème, niveau, source (vocabulaire, verbes, expressions), vitesse, ordre aléatoire, boucle, nombre de mots.
- Les formes à barre oblique sont dites « or » (`was or were`).

## 4. Interface

- Jetons de style (couleurs, rayons, ombres, espacements) définis une fois dans `styles.css` ; couleur d'accent par module : écoute, cartes, exercices, verbes, expressions, grammaire.
- Écrans : accueil (reprendre, objectif du jour, modules), Apprendre (hub : écouter, vocabulaire, verbes, expressions, grammaire), Réviser, Pratiquer, Moi (progression et réglages, dont les voix).
- Un seul bouton principal par écran ; barre de progression pendant une séance ; écran de fin avec résumé et prochaine action.
- Conforme à `prefers-reduced-motion` ; cibles tactiles d'au moins 44 px ; contrastes AA.

## 5. Verbes irréguliers

`groupIrregular(verb): 'unchanged'|'same-past'|'i-a-u'|'en-ending'|'other'` classe chaque verbe. Un champ `essential: true` marque les 20 plus utiles, présentés d'abord. Chaque verbe a une fiche (3 formes, audio, exemples) et un entraînement en choix.

## 6. Grammaire

Chaque leçon devient une suite d'écrans courts : règle en puces (`rule_fr`), formule visuelle (`formula` : liste de `{label, text, color}`), exemples avec audio, mini-quiz. Le contenu des 8 leçons existantes est conservé et réorganisé.

## 7. Expressions

Chaque expression gagne `literal_fr` (traduction mot à mot) et `usage_fr` (quand l'utiliser). `buildMatchQuiz(expressions, rng)` produit un quiz « associe l'expression à son sens ».

## 8. Voix

- `pickVoice(voices, lang, accent, preferredName)` (pure) choisit la voix ; préférence aux voix dont le nom contient `Premium`, `Enhanced`, `Natural`, `Neural` ou `Google`, puis aux voix locales de la bonne langue, puis au repli par langue.
- Préférences stockées dans l'état : `voice: {accent, enName, frName}` et `rate`.
- `tools/generate-audio.mjs` génère aussi les textes de construction (clés `:con`, `:tip`).
- Aucun mp3 n'est généré sans clé fournie par l'utilisateur ; la clé n'est jamais écrite dans l'app.

## 9. Données et migration

L'état stocké (`english-app-v1`) reste valide ; les champs `voice` et `rate` ont des valeurs par défaut au chargement. Les nouveaux champs de contenu sont obligatoires et validés par `validateEntry` et par les tests de données.

## 10. Gestion des erreurs

Inchangée par rapport au design initial (repli sur la voix du navigateur, message si aucune voix pour la langue, stockage indisponible, contenu invalide ignoré), plus : une entrée sans `construction` est refusée par la validation et signalée dans la console.

## 11. Tests

Tests automatiques pour : `buildSteps` (ordre des deux modes, pause, exemples traduits, construction), `pickVoice`, `groupIrregular`, `buildMatchQuiz`, validation des nouveaux champs, complétude du contenu (construction sur 100 % des entrées, au moins 2 exemples, 20 verbes essentiels). Vérification dans le navigateur de chaque écran, sur largeur de téléphone et de bureau.

## 12. Hors périmètre

Comptes, synchronisation, reconnaissance de la prononciation, génération de contenu par IA, application iOS native, génération réelle des mp3 (nécessite la clé de l'utilisateur).
