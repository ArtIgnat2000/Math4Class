import { z } from 'zod';
import { approvedTaskIds, taskApproved } from '../content/approved.ts';
import type { ContentPack } from './content.ts';

const text = z.string().trim().min(1);
const review = z.enum(['unreviewed', 'partial', 'complete']);
const materialSchema = z.discriminatedUnion('kind', [
  z
    .object({
      key: text,
      kind: z.literal('theory'),
      label: text,
      review,
      topicIds: z.array(text),
      evidence: z.string(),
    })
    .strict(),
  z
    .object({
      key: text,
      kind: z.literal('exercise'),
      label: text,
      review,
      expectedParts: z.array(text).min(1).nullable(),
      taskRefs: z.array(z.object({ topicId: text, taskId: text, parts: z.array(text) }).strict()),
      evidence: z.string(),
    })
    .strict(),
]);
const pageSchema = z
  .object({
    number: z.number().int().positive(),
    pdfPage: z.number().int().positive().nullable(),
    scope: z.enum(['instructional', 'excluded']),
    exclusionEvidence: z.string(),
    inventoryComplete: z.boolean(),
    inventoryEvidence: z.string(),
    materials: z.array(materialSchema),
  })
  .strict();
export const textbookCoverageSchema = z
  .object({
    version: z.literal(1),
    books: z
      .array(
        z
          .object({
            id: text,
            title: text,
            authors: z.array(text).min(1),
            publisher: text,
            year: z.number().int().positive(),
            edition: text,
            grade: z.number().int().min(1).max(4),
            part: z.number().int().positive(),
            source: text,
            printedPageCount: z.number().int().positive().nullable(),
            pages: z.array(pageSchema),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type TextbookCoverage = z.infer<typeof textbookCoverageSchema>;
type Material = z.infer<typeof materialSchema>;

// The current source audit and runtime approval list cover this exact edition only.
// Other editions must receive their own explicit adapter before mapping tasks.
const auditedBookId = 'moro-math-grade4-part1-2026-ed16';
function assertUnique(values: string[], where: string) {
  if (new Set(values).size !== values.length) throw new Error(`Повтор ID: ${where}`);
}
function taskVerified(
  bookId: string,
  grade: number,
  page: number,
  item: Extract<Material, { kind: 'exercise' }>,
  ref: { topicId: string; taskId: string },
  pack: ContentPack | undefined,
): boolean {
  if (bookId !== auditedBookId || grade !== 4) return false;
  const source = approvedTaskIds[ref.topicId];
  const exercise = item.key === 'lower' ? 'нижние задания' : item.key;
  const task = pack?.topics
    .find((topic) => topic.id === ref.topicId)
    ?.tasks.find((t) => t.id === ref.taskId);
  return (
    !!source &&
    source.page === page &&
    source.exercise === exercise &&
    source.ids.includes(ref.taskId) &&
    !!task &&
    taskApproved(grade, ref.topicId, task)
  );
}

export function validateCoverage(input: unknown, packs: ContentPack[]): TextbookCoverage {
  const registry = textbookCoverageSchema.parse(input);
  assertUnique(
    registry.books.map((b) => b.id),
    'учебник',
  );
  const allMapped = new Set<string>();
  for (const book of registry.books) {
    const pack = packs.find((p) => p.grade === book.grade);
    assertUnique(
      book.pages.map((p) => String(p.number)),
      `${book.id}: страница`,
    );
    for (const page of book.pages) {
      const where = `${book.id}, стр. ${page.number}`;
      if (book.printedPageCount !== null && page.number > book.printedPageCount)
        throw new Error(`${where}: за пределами учебника`);
      if (
        page.scope === 'excluded' &&
        (!page.exclusionEvidence.trim() || page.materials.length || page.inventoryComplete)
      )
        throw new Error(`${where}: исключение требует обоснование и не содержит материалы`);
      if (
        page.scope === 'instructional' &&
        page.inventoryComplete &&
        (!page.inventoryEvidence.trim() || !page.materials.length)
      )
        throw new Error(`${where}: полная инвентаризация требует материалы и источник сверки`);
      assertUnique(
        page.materials.map((m) => m.key),
        `${where}: материал`,
      );
      for (const item of page.materials) {
        const label = `${where}, ${item.label}`;
        if (item.review !== 'unreviewed' && !item.evidence.trim())
          throw new Error(`${label}: нужна запись о сверке`);
        if (item.kind === 'theory') {
          assertUnique(item.topicIds, label);
          for (const id of item.topicIds)
            if (!pack?.topics.some((t) => t.id === id))
              throw new Error(`${label}: неизвестная тема ${id}`);
          if (
            item.review === 'complete' &&
            (!item.topicIds.length ||
              item.topicIds.some(
                (id) =>
                  !pack?.topics
                    .find((t) => t.id === id)
                    ?.tasks.some((task) => taskApproved(book.grade, id, task)),
              ))
          )
            throw new Error(`${label}: полная теория требует доступных тем`);
        } else {
          assertUnique(
            item.taskRefs.map((r) => `${r.topicId}/${r.taskId}`),
            label,
          );
          for (const ref of item.taskRefs) {
            const key = `${book.id}/${ref.topicId}/${ref.taskId}`;
            if (allMapped.has(key)) throw new Error(`${label}: задание уже привязано ${key}`);
            allMapped.add(key);
            if (!taskVerified(book.id, book.grade, page.number, item, ref, pack))
              throw new Error(
                `${label}: не подтверждена точная привязка ${ref.topicId}/${ref.taskId}`,
              );
          }
          if (item.expectedParts !== null) {
            assertUnique(item.expectedParts, `${label}: части источника`);
            for (const ref of item.taskRefs) {
              assertUnique(ref.parts, `${label}: части задания`);
              if (ref.parts.some((part) => !item.expectedParts?.includes(part)))
                throw new Error(`${label}: неизвестная часть источника`);
            }
          } else if (item.taskRefs.some((ref) => ref.parts.length))
            throw new Error(`${label}: сначала перечислите все части источника`);
          const linkedParts = new Set(item.taskRefs.flatMap((ref) => ref.parts));
          if (
            item.review === 'complete' &&
            (item.expectedParts === null ||
              item.expectedParts.some((part) => !linkedParts.has(part)))
          )
            throw new Error(`${label}: полнота упражнения не подтверждена по частям`);
        }
      }
    }
    if (book.id === auditedBookId) {
      for (const [topicId, source] of Object.entries(approvedTaskIds))
        for (const taskId of source.ids) {
          if (!allMapped.has(`${book.id}/${topicId}/${taskId}`))
            throw new Error(
              `${book.id}: отсутствует привязка утверждённого задания ${topicId}/${taskId}`,
            );
        }
    }
  }
  return registry;
}

export function pageComplete(page: TextbookCoverage['books'][number]['pages'][number]): boolean {
  return (
    page.scope === 'instructional' &&
    page.inventoryComplete &&
    page.materials.length > 0 &&
    page.materials.every((item) => item.review === 'complete')
  );
}

function clean(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
function missingRanges(count: number, numbers: number[]): string {
  const present = new Set(numbers);
  const ranges: string[] = [];
  for (let start = 1; start <= count; start++) {
    if (present.has(start)) continue;
    let end = start;
    while (end < count && !present.has(end + 1)) end++;
    ranges.push(start === end ? `${start}` : `${start}–${end}`);
    start = end;
  }
  return ranges.length ? ranges.join(', ') : 'нет';
}
export function renderCoverage(registry: TextbookCoverage, packs: ContentPack[]): string {
  const lines = [
    '# Отчёт об охвате учебников',
    '',
    '> Формируется командой `npm run coverage:report` из `coverage-data/textbooks.json`. Полнота подтверждается ручной сверкой; число видимых заданий не доказывает полноту упражнения или страницы.',
    '',
    'Покрытие считается отдельно по каждому точному изданию. Неизвестные страницы и неинвентаризированные материалы не считаются покрытыми. Авторские задания, тематические ссылки и скрытый банк не засчитываются.',
    '',
    '| Учебник | Подтверждённых заданий | Полностью покрытых учебных страниц | Охват учебника |',
    '| --- | --- | --- | --- |',
  ];
  for (const book of registry.books) {
    const complete = book.pages.filter(pageComplete).length;
    const tasks = book.pages
      .flatMap((p) => p.materials)
      .reduce((count, item) => count + (item.kind === 'exercise' ? item.taskRefs.length : 0), 0);
    const excluded = book.pages.filter((p) => p.scope === 'excluded').length;
    const total = book.printedPageCount === null ? null : book.printedPageCount - excluded;
    const percent =
      total === null || total === 0
        ? 'неизвестен: не задан полный диапазон учебных страниц'
        : `${complete}/${total} (${((100 * complete) / total).toFixed(1)}%; нижняя граница)`;
    lines.push(
      `| ${clean(book.title)}, ${book.year}, ${clean(book.edition)} | ${tasks} | ${complete} | ${percent} |`,
    );
  }
  for (const book of registry.books) {
    const pack = packs.find((p) => p.grade === book.grade);
    const topicName = (id: string) =>
      clean(pack?.topics.find((topic) => topic.id === id)?.title ?? id);
    lines.push(
      '',
      `## ${clean(book.title)} — ${book.year}, ${clean(book.edition)}`,
      '',
      `**ID:** \`${book.id}\`  `,
      `**Авторы:** ${book.authors.map(clean).join(', ')}  `,
      `**Издательство:** ${clean(book.publisher)}; класс ${book.grade}, часть ${book.part}  `,
      `**Основание:** ${clean(book.source)}  `,
      `**Последняя печатная страница:** ${book.printedPageCount ?? 'не установлена'}; не перечисленные страницы — неизвестны.  `,
      `**Не заведены в реестре:** ${
        book.printedPageCount === null
          ? 'диапазон неизвестен'
          : missingRanges(
              book.printedPageCount,
              book.pages.map((p) => p.number),
            )
      }.  `,
      `**Учебные страницы с полной инвентаризацией:** ${book.pages.filter((p) => p.scope === 'instructional' && p.inventoryComplete).length}; записей страниц: ${book.pages.length}.`,
      '',
    );
    for (const page of [...book.pages].sort((a, b) => a.number - b.number)) {
      if (page.scope === 'excluded') {
        lines.push(
          `### Страница ${page.number} — исключена из учебного охвата`,
          '',
          `Причина: ${clean(page.exclusionEvidence)}`,
          '',
        );
        continue;
      }
      const full = pageComplete(page);
      lines.push(
        `### Страница ${page.number} — ${full ? 'полностью покрыта' : 'полнота не подтверждена'}`,
        '',
        `Страница PDF: ${page.pdfPage ?? 'не указана'}; инвентаризация: ${page.inventoryComplete ? `полная (${clean(page.inventoryEvidence)})` : 'не завершена'}.`,
        '',
        '| Материал | Сверка полноты | Связь с программой |',
        '| --- | --- | --- |',
      );
      for (const item of page.materials) {
        const status =
          item.review === 'complete'
            ? 'полная'
            : item.review === 'partial'
              ? 'частичная'
              : 'не проверена';
        const mapping =
          item.kind === 'theory'
            ? item.topicIds.length
              ? item.topicIds.map((id) => `${topicName(id)} (\`${id}\`)`).join(', ')
              : 'связь не проверена'
            : `${item.taskRefs.length} подтверждённых заданий${item.expectedParts === null ? '; общее число частей неизвестно' : `; охвачено ${new Set(item.taskRefs.flatMap((ref) => ref.parts)).size} из ${item.expectedParts.length} частей`}${
                item.taskRefs.length
                  ? ': ' +
                    [...new Set(item.taskRefs.map((r) => r.topicId))]
                      .map(
                        (id) =>
                          `${topicName(id)} (\`${id}\`: ${item.taskRefs
                            .filter((r) => r.topicId === id)
                            .map(
                              (r) =>
                                `\`${r.taskId}\`${r.parts.length ? ` → ${r.parts.map(clean).join(', ')}` : ''}`,
                            )
                            .join(', ')})`,
                      )
                      .join('; ')
                  : ''
              }`;
        lines.push(
          `| ${clean(item.label)} | ${status}${item.evidence ? ` (${clean(item.evidence)})` : ''} | ${mapping} |`,
        );
      }
      lines.push('');
    }
  }
  return lines.join('\n') + '\n';
}
