import { z } from 'zod';

export const gradeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export type Grade = z.infer<typeof gradeSchema>;
export const GRADES: Grade[] = [1, 2, 3, 4];
export const CATEGORIES = {
  numbers: 'Числа',
  operations: 'Действия',
  quantities: 'Величины',
  geometry: 'Геометрия',
  problems: 'Задачи',
} as const;
export type Category = keyof typeof CATEGORIES;
export const idSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, 'Используйте латиницу, цифры, дефис и подчёркивание');
const text = z.string().trim().min(1).max(1500);
const diagramSchema = z
  .discriminatedUnion('type', [
    z
      .object({
        type: z.literal('square-parts'),
        sideLabel: text,
        parts: z.union([z.literal(2), z.literal(4)]),
      })
      .strict(),
    z.object({ type: z.literal('rectangle'), widthLabel: text, heightLabel: text }).strict(),
    z
      .object({
        type: z.literal('fraction'),
        parts: z.number().int().min(2).max(12),
        shaded: z.number().int().min(0).max(12),
      })
      .strict(),
  ])
  .refine(
    (d) => d.type !== 'fraction' || d.shaded <= d.parts,
    'Закрашенных частей не может быть больше общего числа',
  );
const baseTask = {
  id: idSchema,
  question: text,
  expression: z.string().trim().min(1).max(150).optional(),
  hint: text,
  explanation: text,
  diagram: diagramSchema.optional(),
};
const options = z
  .array(z.object({ id: idSchema, label: z.string().trim().min(1).max(160) }).strict())
  .min(2)
  .max(8);
export const taskSchema = z
  .discriminatedUnion('type', [
    z
      .object({
        ...baseTask,
        type: z.literal('number'),
        answer: z.number().finite(),
        unit: z.string().max(30).optional(),
        tolerance: z.number().min(0).max(1).optional(),
      })
      .strict(),
    z
      .object({
        ...baseTask,
        type: z.literal('division'),
        dividend: z.number().int().min(0).max(1_000_000),
        divisor: z.number().int().min(1).max(1_000_000),
        answer: z
          .object({
            quotient: z.number().int().min(0).max(1_000_000),
            remainder: z.number().int().min(0).max(1_000_000),
          })
          .strict(),
      })
      .strict(),
    z.object({ ...baseTask, type: z.literal('choice'), options, answer: idSchema }).strict(),
    z
      .object({
        ...baseTask,
        type: z.literal('compare'),
        left: z.string().min(1).max(100),
        right: z.string().min(1).max(100),
        answer: z.enum(['<', '=', '>']),
      })
      .strict(),
    z
      .object({
        ...baseTask,
        type: z.literal('order'),
        items: options,
        answer: z.array(idSchema).min(2).max(8),
      })
      .strict(),
  ])
  .superRefine((task, ctx) => {
    if (
      task.type === 'division' &&
      (task.answer.remainder >= task.divisor ||
        task.answer.quotient * task.divisor + task.answer.remainder !== task.dividend)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['answer'],
        message:
          'Проверьте деление: делимое = делитель × неполное частное + остаток, а остаток меньше делителя',
      });
    }
    if (task.type === 'choice') {
      const ids = task.options.map((o) => o.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: 'custom', message: 'ID вариантов должны быть уникальны' });
      if (!ids.includes(task.answer))
        ctx.addIssue({ code: 'custom', message: 'Ответа нет среди вариантов' });
    }
    if (task.type === 'order') {
      const ids = task.items.map((o) => o.id);
      if (
        new Set(ids).size !== ids.length ||
        new Set(task.answer).size !== task.answer.length ||
        task.answer.length !== ids.length ||
        task.answer.some((id) => !ids.includes(id))
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Порядок должен содержать все ID элементов ровно по одному разу',
        });
      }
    }
  });
export type Task = z.infer<typeof taskSchema>;
export const referenceSchema = z
  .object({
    kind: z.enum(['page', 'contents', 'intro']),
    pages: z.array(z.number().int().min(1).max(1000)).max(20),
    exercises: z.array(z.number().int().positive()).max(30).optional(),
  })
  .strict()
  .refine((ref) => ref.kind === 'intro' || ref.pages.length > 0, 'Нужна страница учебника');
export type TopicReference = z.infer<typeof referenceSchema>;
export const curriculumSchema = z
  .object({
    series: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(150),
    authors: z.array(z.string().trim().min(1).max(100)).min(1).max(12),
    publisher: z.string().trim().min(1).max(100),
    year: z.number().int().min(1900).max(2100),
    part: z.number().int().min(1).max(9),
    edition: z.string().trim().min(1).max(120).optional(),
    coverage: z.string().trim().min(1).max(500),
  })
  .strict();
export const sectionSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(300).optional(),
    topicIds: z.array(idSchema).min(1).max(60),
  })
  .strict();
export const topicSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(180),
    category: z.enum(['numbers', 'operations', 'quantities', 'geometry', 'problems']),
    color: z.enum(['sage', 'peach', 'lavender', 'blue', 'butter']),
    symbol: z.enum([
      'numbers',
      'plus',
      'multiply',
      'ruler',
      'shapes',
      'fraction',
      'puzzle',
      'brackets',
      'clock',
    ]),
    isDemo: z.boolean().optional(),
    challenge: z.boolean().optional(),
    reference: referenceSchema.optional(),
    minutes: z.number().int().min(1).max(30),
    lessonSize: z.number().int().min(1).max(10).default(5),
    theory: z.object({ title: text, text, example: text }).strict(),
    tasks: z.array(taskSchema).min(1).max(200),
  })
  .strict()
  .superRefine((topic, ctx) => {
    if (new Set(topic.tasks.map((t) => t.id)).size !== topic.tasks.length)
      ctx.addIssue({
        code: 'custom',
        path: ['tasks'],
        message: 'ID заданий внутри темы должны быть уникальны',
      });
  });
export type Topic = z.infer<typeof topicSchema>;
export const packSchema = z
  .object({
    version: z.literal(1),
    grade: gradeSchema,
    isDemo: z.boolean().default(false),
    title: z.string().trim().min(1).max(120),
    curriculum: curriculumSchema.optional(),
    sections: z.array(sectionSchema).min(1).max(12).optional(),
    topics: z.array(topicSchema).min(1).max(60),
  })
  .strict()
  .superRefine((pack, ctx) => {
    if (pack.sections) {
      const sectionIds = pack.sections.map((section) => section.id);
      const topicIds = pack.sections.flatMap((section) => section.topicIds);
      const known = new Set(pack.topics.map((topic) => topic.id));
      if (
        new Set(sectionIds).size !== sectionIds.length ||
        new Set(topicIds).size !== topicIds.length ||
        topicIds.length !== known.size ||
        topicIds.some((id) => !known.has(id))
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['sections'],
          message: 'Каждая тема должна входить ровно в один раздел; ID разделов не повторяются',
        });
      }
    }
    if (new Set(pack.topics.map((t) => t.id)).size !== pack.topics.length)
      ctx.addIssue({
        code: 'custom',
        path: ['topics'],
        message: 'ID тем внутри класса должны быть уникальны',
      });
  });
export type ContentPack = z.infer<typeof packSchema>;

export function parsePack(raw: unknown): ContentPack {
  return packSchema.parse(raw);
}
export function describeValidationError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return `Проверьте поле «${issue.path.join('.') || 'файл'}»: ${issue.message}.`;
  }
  return 'Не удалось прочитать JSON. Проверьте формат файла.';
}
