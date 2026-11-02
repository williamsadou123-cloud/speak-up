import test from 'node:test';
import assert from 'node:assert/strict';
import { placementLevel } from '../src/placement.js';

test('0 correct gives A1', () => assert.equal(placementLevel(0, 10), 'A1'));
test('all correct gives C1', () => assert.equal(placementLevel(10, 10), 'C1'));
test('half gives B1', () => assert.equal(placementLevel(5, 10), 'B1'));
test('monotonic: more correct never gives a lower level', () => {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1'];
  let prev = -1;
  for (let c = 0; c <= 10; c++) {
    const i = order.indexOf(placementLevel(c, 10));
    assert.ok(i >= prev);
    prev = i;
  }
});
test('total 0 falls back to B1', () => assert.equal(placementLevel(0, 0), 'B1'));
