import { writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { packSchema } from '../src/engine/content.ts';
const schema = z.toJSONSchema(packSchema, { target: 'draft-7' });
schema.title = 'Число — пакет учебных материалов v1';
schema.description =
  'Дополнительно движок проверяет уникальность ID, ссылки на ответы и корректность диаграмм.';
await writeFile('public/content/schema.json', JSON.stringify(schema, null, 2) + '\n');
console.log('✓ public/content/schema.json');
