import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPartition } from './e2e-shard-validation.mjs';

test('accepts a complete disjoint partition', () => {
  assert.doesNotThrow(() => verifyPartition(['a', 'b', 'c'], [['a', 'c'], ['b']]));
});
test('rejects missing, duplicated and unexpected tests', () => {
  assert.throws(() => verifyPartition(['a', 'b', 'c'], [['a'], ['b']]), /отсутствуют/);
  assert.throws(() => verifyPartition(['a', 'b'], [['a'], ['a', 'b']]), /нескольких/);
  assert.throws(() => verifyPartition(['a', 'b'], [['a'], ['b', 'x']]), /Лишний/);
});
test('rejects empty and duplicate discovery results', () => {
  assert.throws(() => verifyPartition([], [[]]), /не нашёл/);
  assert.throws(() => verifyPartition(['a', 'a'], [['a']]), /Дубли/);
  assert.throws(() => verifyPartition(['a'], [['a'], []]), /пуста/);
});
