import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { parsePack } from '../src/engine/content.ts';
import { renderCoverage, validateCoverage } from '../src/engine/textbook-coverage.ts';

const registryPath = 'coverage-data/textbooks.json';
const reportPath = 'docs/TEXTBOOK_COVERAGE_REPORT.md';
const mode = process.argv[2] ?? '--write';
if (!['--write', '--check', '--stdout'].includes(mode)) {
  console.error('Использование: npm run coverage:report [-- --write|--check|--stdout]');
  process.exit(1);
}
try {
  const raw = JSON.parse(await readFile(registryPath, 'utf8'));
  const packs = await Promise.all(
    [1, 2, 3, 4].map(async (grade) =>
      parsePack(JSON.parse(await readFile(`src/content/grade-${grade}.json`, 'utf8'))),
    ),
  );
  const report = await format(renderCoverage(validateCoverage(raw, packs), packs), {
    parser: 'markdown',
    singleQuote: true,
    printWidth: 100,
  });
  if (mode === '--stdout') process.stdout.write(report);
  else if (mode === '--write') {
    await writeFile(reportPath, report);
    console.log(`Отчёт обновлён: ${reportPath}`);
  } else {
    const saved = await readFile(reportPath, 'utf8');
    if (saved !== report) throw new Error('Отчёт устарел: выполните npm run coverage:report');
    console.log(`Реестр и отчёт проверены: ${reportPath}`);
  }
} catch (error) {
  console.error(`Ошибка контроля охвата: ${error.message}`);
  process.exitCode = 1;
}
