import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, sameText } from '../tools/check-audio.mjs';

test('normalize lowercases and drops punctuation and extra spaces', () => {
  assert.equal(normalize('  Need, was or  were, BEEN. '), 'need was or were been');
  assert.equal(normalize("I'm fine!"), "i'm fine");
});
test('sameText ignores case and punctuation but catches a different word', () => {
  assert.equal(sameText('luggage', 'Luggage.'), true);
  assert.equal(sameText('luggage', 'Baggage.'), false);
});
test('sameText treats a spelled-out number and its digits as equal', () => {
  assert.equal(sameText('I have 2 cats.', 'I have two cats.'), true);
});

import { variants } from '../tools/fix-audio.mjs';
test('variants: several seeds, plus a dotted version for lists of forms', () => {
  assert.equal(variants('sore').length, 13);
  const v = variants('send, sent, sent');
  assert.equal(v.length, 7);
  assert.equal(v[4].text, 'send. sent. sent.');
});
