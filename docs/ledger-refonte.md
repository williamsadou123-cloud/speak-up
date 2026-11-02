# Ledger — plan: docs/superpowers/plans/2026-11-01-refonte.md
Pre-flight: Task 4 schema (construction/essential/literal_fr) consumed by 5-8 content, 9-15 UI; Task 1 buildSteps by 10; Task 2 by 11; Task 3 by 14/15; no conflicts found.
Task 1-3: complete (tests 97/97)
Task 4: complete (validation tests green; completeness tests red until Task 8 by design; build tool --partial flag added for staged content: Ruling — needed since tasks 5-7 land separately)
Task 5: complete (206/206 vocab construction merged via --partial build)
Task 6: complete (146 verbs: construction + 2nd example; 20 essential)
Task 7: complete (69 expressions, full non-partial build passes)
Task 8: complete (tests 106/106). Ruling: formula chips carry optional numeric 'row' (default 0) so a lesson can show several formulas — spec lists {label,text,color} only; additive, cost if wrong: none
Task 9-15: UI written and browser-verified (home, learn, listen both modes incl. 4 s guess countdown, cards flip+3 grades, exercises explain, verbs 5 tabs, grammar steps, expressions quiz, voice settings persists). Ruling: added src/ui/vocab.js (hub lists Vocabulaire; plan had no screen for it). Ruling: listening shows full sheet in a <details> auto-opened at end of each word (avoids layout jump). Ruling: progress.js removed, folded into me.js (route #/progress kept as alias). Final-fix: macOS novelty voices (Albert, Bahh...) were recommended — now ranked last, 2 tests RED->GREEN
Task 16 (generator): complete, tests 120/120. Process note: --only/onlyKinds test written after implementation (not watched RED). Full generation = 4313 files / 123k chars; --only word,fr,ex = 1708 files / 31k chars
Final review (fresh reviewer, opus): 0 Critical, 3 Important, several Minor.
Final: fixed contrast AA (--on-mod token, darker cards/verbs) — visual check only
Final: fixed 5 factual content errors (dizzy, vegetarian, tell, listen, read IPA) + French-word-in-English-pattern + citizen definition + accommodation wording — data rebuilt, suite 123/123
Final: fixed cloze capital-letter giveaway — test RED->GREEN
Final: fixed "=" spoken as « égal » (now "veut dire"/"means") — test RED->GREEN
Final: fixed overlapping audio (speak stops current clip) — test RED->GREEN
Final: minor (deferred): listening "Fiche complète" empty mid-word; regular verb sheet lacks 3 forms; listen rate not saved; scrollIntoView ignores reduced-motion; grammar validation does not require examples/exercises; articles formula shows "+" between rule and example chips; tab-bar due badge stale until next route; aria-label on non-roled spans; "Rejouer" returns to intro; verbs practice slash forms give away answer; buildMatchQuiz signature (expressions,count,rng) differs from spec
SW: mp3 cache-first with Range support (own cache speak-up-audio-v1), 4 tests RED->GREEN via vm; NOT verifiable in embedded pane (no SW registration)
Redesign pastel skin (wave headers, floating pill nav, pastel cards, home resume ring, profile+badges, avatars). Minors fixed: listen sheet filled at start, rate saved, regular verb forms, reduced-motion scroll, articles formula arrow. SW cache v5.
