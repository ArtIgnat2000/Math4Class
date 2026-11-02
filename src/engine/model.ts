import { z } from 'zod';
import { gradeSchema, idSchema, packSchema, taskSchema } from './content';

const count = z.number().int().min(0).max(1_000_000_000);
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00`);
    return (
      Number.isFinite(date.getTime()) &&
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` ===
        value
    );
  }, 'Некорректная дата');
export const answerSchema = z.union([
  z.string().max(200),
  z.array(z.string().max(80)).max(8),
  z.object({ quotient: z.string().max(32), remainder: z.string().max(32) }).strict(),
]);
export type Answer = z.infer<typeof answerSchema>;
export const attemptSchema = z
  .object({
    taskId: idSchema,
    answer: answerSchema,
    correct: z.boolean(),
    assisted: z.boolean(),
    retry: z.boolean(),
  })
  .strict();
export const sessionSchema = z
  .object({
    id: z.string().min(1).max(100),
    grade: gradeSchema,
    topicId: idSchema,
    topicTitle: z.string().min(1).max(80),
    mode: z.enum(['learn', 'practice', 'review']),
    startedAt: z.number().finite().positive(),
    entries: z
      .array(z.object({ task: taskSchema, retry: z.boolean() }).strict())
      .min(1)
      .max(20),
    initialCount: z.number().int().min(1).max(10),
    cursor: z.number().int().min(0).max(19),
    attempts: z.array(attemptSchema).max(20),
    hintOpen: z.boolean(),
    feedback: z.object({ correct: z.boolean() }).strict().nullable(),
  })
  .strict()
  .superRefine((session, ctx) => {
    if (
      session.cursor >= session.entries.length ||
      session.initialCount !== session.entries.filter((e) => !e.retry).length ||
      session.attempts.length !== session.cursor + (session.feedback ? 1 : 0)
    ) {
      ctx.addIssue({ code: 'custom', message: 'Нарушена последовательность занятия' });
    }
    session.attempts.forEach((attempt, i) => {
      if (
        attempt.taskId !== session.entries[i]?.task.id ||
        attempt.retry !== session.entries[i]?.retry
      )
        ctx.addIssue({ code: 'custom', message: 'Попытка не соответствует заданию' });
    });
  });
export type Session = z.infer<typeof sessionSchema>;
export const topicProgressSchema = z
  .object({
    level: z.number().int().min(0).max(3),
    bestStars: z.number().int().min(0).max(3),
    sessions: count,
    correct: count,
    total: count,
    mistakeIds: z.array(idSchema).max(200),
    dueDay: day,
    lastDay: day,
    lastAdvancedDay: day.nullable(),
  })
  .strict()
  .refine((p) => p.correct <= p.total, 'Верных ответов больше общего числа');
export type TopicProgress = z.infer<typeof topicProgressSchema>;
export const resultSchema = z
  .object({
    id: z.string().min(1).max(100),
    topicId: idSchema,
    topicTitle: z.string().min(1).max(80),
    grade: gradeSchema,
    day,
    correct: count,
    total: z.number().int().min(1).max(10),
    assisted: count,
    recovered: count,
    xp: count,
    stars: z.number().int().min(1).max(3),
    mode: z.enum(['learn', 'practice', 'review']),
  })
  .strict()
  .refine(
    (r) => r.correct <= r.total && r.assisted <= r.total && r.recovered <= r.total,
    'Некорректные итоги занятия',
  );
export type LessonResult = z.infer<typeof resultSchema>;
export const profileSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(24),
    grade: gradeSchema,
    avatar: z.enum(['sage', 'peach', 'lavender', 'blue']),
    goal: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    topics: z.record(z.string().max(100), topicProgressSchema),
    daily: z.record(
      day,
      z
        .object({ tasks: count, correct: count, lessons: count, xp: count })
        .strict()
        .refine((d) => d.correct <= d.tasks),
    ),
    totals: z
      .object({
        tasks: count,
        correct: count,
        lessons: count,
        xp: count,
        recovered: count,
        perfect: count,
      })
      .strict()
      .refine((t) => t.correct <= t.tasks && t.perfect <= t.lessons),
    history: z.array(resultSchema).max(180),
    activeSession: sessionSchema.nullable(),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;
export const appDataSchema = z
  .object({
    version: z.literal(1),
    activeProfileId: z.string().min(1).max(100),
    profiles: z.array(profileSchema).min(1).max(12),
    settings: z.object({ reducedMotion: z.boolean() }).strict(),
    customPacks: z.array(packSchema).max(4),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      !data.profiles.some((p) => p.id === data.activeProfileId) ||
      new Set(data.profiles.map((p) => p.id)).size !== data.profiles.length
    )
      ctx.addIssue({ code: 'custom', message: 'Проверьте ID профилей' });
    if (new Set(data.customPacks.map((p) => p.grade)).size !== data.customPacks.length)
      ctx.addIssue({ code: 'custom', message: 'Для каждого класса допустим один пакет' });
  });
export type AppData = z.infer<typeof appDataSchema>;

export function uid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  );
}
export function createProfile(
  name = 'Исследователь',
  grade: Profile['grade'] = 4,
  avatar: Profile['avatar'] = 'sage',
): Profile {
  return {
    id: uid(),
    name,
    grade,
    avatar,
    goal: 5,
    topics: {},
    daily: {},
    totals: { tasks: 0, correct: 0, lessons: 0, xp: 0, recovered: 0, perfect: 0 },
    history: [],
    activeSession: null,
  };
}
export function createAppData(): AppData {
  const profile = createProfile();
  return {
    version: 1,
    activeProfileId: profile.id,
    profiles: [profile],
    settings: { reducedMotion: false },
    customPacks: [],
  };
}
