import { describe, expect, it } from 'vitest';
import registry from '../coverage-data/textbooks.json';
import { BUILTIN_PACKS } from '../src/content/index';
import {
  pageComplete,
  renderCoverage,
  textbookCoverageSchema,
  validateCoverage,
  type TextbookCoverage,
} from '../src/engine/textbook-coverage';

const packs = Object.values(BUILTIN_PACKS);
const copy = () => textbookCoverageSchema.parse(structuredClone(registry));
function exercise(data: TextbookCoverage) {
  const item = data.books[0].pages[0].materials[5];
  if (item.kind !== 'exercise') throw new Error('Expected exercise');
  return item;
}

describe('textbook coverage', () => {
  it('reports exact known textbook exercises without inventing total coverage', () => {
    const data = validateCoverage(copy(), packs);
    const report = renderCoverage(data, packs);
    expect(report).toContain('неизвестен: не задан полный диапазон');
    expect(report).toContain('№ 219');
    expect(report).toContain('equations-add-subtract');
    expect(report).toContain('add-left');
    expect(report).not.toContain('roman-four');
    expect(data.books[0].pages.every((page) => !pageComplete(page))).toBe(true);
  });

  it('rejects a stale, duplicated or misattributed textbook task', () => {
    const stale = copy();
    exercise(stale).taskRefs[0].taskId = 'not-a-task';
    expect(() => validateCoverage(stale, packs)).toThrow('не подтверждена точная привязка');
    const duplicate = copy();
    exercise(duplicate).taskRefs.push(exercise(duplicate).taskRefs[0]);
    expect(() => validateCoverage(duplicate, packs)).toThrow('Повтор ID');
    const misplaced = copy();
    exercise(misplaced).key = '218-other';
    expect(() => validateCoverage(misplaced, packs)).toThrow('не подтверждена точная привязка');
  });

  it('refuses to claim full coverage without a complete inventory, evidence and all parts', () => {
    const incomplete = copy();
    incomplete.books[0].pages[0].inventoryComplete = true;
    expect(() => validateCoverage(incomplete, packs)).toThrow('полная инвентаризация');
    const missingEvidence = copy();
    exercise(missingEvidence).review = 'complete';
    expect(() => validateCoverage(missingEvidence, packs)).toThrow('нужна запись о сверке');
    const missingCount = copy();
    exercise(missingCount).review = 'complete';
    exercise(missingCount).evidence = 'сверено';
    expect(() => validateCoverage(missingCount, packs)).toThrow('полнота упражнения');
  });

  it('requires an explicit mapping for every source part before marking an exercise complete', () => {
    const data = copy();
    const item = exercise(data);
    item.review = 'complete';
    item.evidence = 'Сверено с источником';
    item.expectedParts = ['а', 'б'];
    item.taskRefs[0].parts = ['а'];
    expect(() => validateCoverage(data, packs)).toThrow('полнота упражнения');
    item.taskRefs[1].parts = ['б'];
    expect(() => validateCoverage(data, packs)).not.toThrow();
    item.taskRefs[1].parts = ['в'];
    expect(() => validateCoverage(data, packs)).toThrow('неизвестная часть');
  });

  it('requires all inventoried materials, including theory, for a complete page', () => {
    const page = copy().books[0].pages[0];
    page.inventoryComplete = true;
    page.materials.forEach((item) => {
      item.review = 'complete';
    });
    expect(pageComplete(page)).toBe(true);
    page.materials[0].review = 'unreviewed';
    expect(pageComplete(page)).toBe(false);
    page.inventoryComplete = false;
    expect(pageComplete(page)).toBe(false);
  });

  it('keeps editions separate and treats missing pages as unknown', () => {
    const data = copy();
    const another = structuredClone(data.books[0]);
    another.id = 'second-book';
    another.title = 'Другой учебник';
    another.printedPageCount = 4;
    another.pages = [];
    data.books.push(another);
    const report = renderCoverage(validateCoverage(data, packs), packs);
    expect(report).toContain('Другой учебник');
    expect(report).toContain('0/4 (0.0%; нижняя граница)');
    expect(report).toContain('1–4');
    another.pages = structuredClone(data.books[0].pages);
    another.printedPageCount = null;
    expect(() => validateCoverage(data, packs)).toThrow('не подтверждена точная привязка');
  });
});
