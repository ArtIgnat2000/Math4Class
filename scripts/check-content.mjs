import { readFile } from 'node:fs/promises';
import { parsePack, describeValidationError } from '../src/engine/content.ts';
const files = process.argv.slice(2);
if (!files.length) {
  for (let grade = 1; grade <= 4; grade++) files.push(`src/content/grade-${grade}.json`);
  files.push('public/content/example-grade-4.json');
}
let failed = false;
for (const file of files) {
  try {
    const pack = parsePack(JSON.parse(await readFile(file, 'utf8')));
    const tasks = pack.topics.reduce((sum, topic) => sum + topic.tasks.length, 0);
    console.log(`✓ ${file}: ${pack.grade} класс, тем: ${pack.topics.length}, заданий: ${tasks}`);
  } catch (error) {
    failed = true;
    console.error(`✗ ${file}: ${describeValidationError(error)}`);
  }
}
if (failed) process.exitCode = 1;
