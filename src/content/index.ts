import grade1 from './grade-1.json';
import grade2 from './grade-2.json';
import grade3 from './grade-3.json';
import grade4 from './grade-4.json';
import { parsePack, type ContentPack, type Grade } from '../engine/content';
import { visiblePack } from './approved';
export const BUILTIN_PACKS: Record<Grade, ContentPack> = {
  1: parsePack(grade1),
  2: parsePack(grade2),
  3: parsePack(grade3),
  4: parsePack(grade4),
};
export function getPack(grade: Grade, customPacks: ContentPack[]): ContentPack {
  return visiblePack(customPacks.find((p) => p.grade === grade) ?? BUILTIN_PACKS[grade]);
}
