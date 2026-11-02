# Ledger — plan: docs/superpowers/plans/2026-11-01-english-learning-app.md
Pre-flight: tasks share interfaces via src/*.js; checked while writing, no conflicts.
Task 1-6: complete (tests 54/54 at commit "UI ...")
Task 7-10: complete, verified in browser (placement, listen, cards, exercises, verbs, expressions, grammar, progress, mobile width)
Task 11: complete (tools/generate-audio.mjs, dry-run OK, missing key message OK; no real generation run: no key)
Task 12: browser walkthrough done; service worker registration could not be verified in the embedded pane
Ruling: node --test glob "tests/*.test.js" instead of "tests/" — Node 24 treats the directory form as a module — cost if wrong: none
Ruling: audio keys extended beyond spec (fr, defen, forms) — needed for FR->EN mode and irregular verb forms — cost if wrong: regenerate a few mp3
Ruling: content authored as compact content/*.txt, converted to data/*.json by tools/build-content.mjs — keeps content editable — cost if wrong: none
Ruling: git repo initialised in the session folder (it was not a repo) — plan Task 1 said so — cost if wrong: none
Ruling: easy interval = max(good+1, round(base*1.3)) — found in browser: easy == good (1 day) on new cards — fixed with test RED->GREEN
Final review (fresh reviewer, opus): 0 Critical, 7 Important, several Minor.
Final: fixed placement lock when hash unchanged — verified in browser (Passer -> home from #/home)
Final: fixed no-English-voice detection — 2 tests RED->GREEN (voices exist but none match; empty list = unknown), verified in browser
Final: fixed stop during mp3 load speaking old text, and stalled-stream freeze (30 s cap) — test RED->GREEN
Final: fixed listen exercise without audio (text fallback shown, aria-label no longer leaks the answer) — browser path covered by no-voice check
Final: fixed answers sharing a French translation (alts) and near-duplicate distractors — 2 tests RED->GREEN
Final: fixed Rejouer wiping state (ctx.go with hash nonce instead of reload)
Final: fixed offline (precache of all src/data/icons, 206 not cached) — NOT verifiable in embedded pane
Final: fixed slash forms spoken "was or were" (UI + generator) — test RED->GREEN; 'Raté' gives 0 xp; progress streak consistent; listen count label re-renders; load-failure fallback message
Final: minor (deferred): 'hard' on a new card = 1 day, same as 'good'
Final: minor (deferred): order exercise accepts one word order; "I am" vs "I'm" rejected
Final: minor (deferred): empty/partial content not guarded (grammar lesson without exercises, empty verbs list)
Final: minor (deferred): topic labels shown in English (travel, irregular...)
Final: minor (deferred): network-first service worker has no timeout
Final: minor (deferred): content wording ("I do exercise" unnatural, 'excité' false friend)
Final: minor (deferred): up to 10 new cards added per visit even when many due; resume after pause restarts the item
