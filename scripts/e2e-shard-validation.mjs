/** Verify that every test/project is present in exactly one shard. */
export function verifyPartition(all, shards) {
  if (all.length === 0) throw new Error('Playwright не нашёл тесты.');
  const expected = new Set(all);
  if (expected.size !== all.length) throw new Error('Дубли тестов в полном списке.');
  const seen = new Set();
  for (let i = 0; i < shards.length; i++) {
    if (shards[i].length === 0) throw new Error(`Часть ${i + 1} пуста.`);
    for (const test of shards[i]) {
      if (!expected.has(test)) throw new Error(`Лишний тест в части ${i + 1}: ${test}`);
      if (seen.has(test)) throw new Error(`Тест находится в нескольких частях: ${test}`);
      seen.add(test);
    }
  }
  const missing = all.filter((test) => !seen.has(test));
  if (missing.length) throw new Error(`Тесты отсутствуют в частях: ${missing.join(', ')}`);
}
