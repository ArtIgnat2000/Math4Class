import type { Grade, Topic } from './content';
import { checkAnswer, shuffled } from './answers';
import { addDays, dayKey } from './dates';
import { uid, type Answer, type LessonResult, type Profile, type Session } from './model';
import { topicKey } from './progress';

export function createSession(
  topic: Topic,
  grade: Grade,
  mode: Session['mode'] = 'learn',
  mistakeIds: string[] = [],
  random = Math.random,
): Session {
  const prioritized = mode === 'review' ? topic.tasks.filter((t) => mistakeIds.includes(t.id)) : [];
  const rest = shuffled(
    topic.tasks.filter((t) => !prioritized.some((p) => p.id === t.id)),
    random,
  );
  const tasks = [...shuffled(prioritized, random), ...rest].slice(0, topic.lessonSize);
  return {
    id: uid(),
    grade,
    topicId: topic.id,
    topicTitle: topic.title,
    mode,
    startedAt: Date.now(),
    entries: tasks.map((task) => ({ task, retry: false })),
    initialCount: tasks.length,
    cursor: 0,
    attempts: [],
    hintOpen: false,
    feedback: null,
  };
}
export function submitAnswer(session: Session, answer: Answer): Session {
  if (session.feedback) return session;
  const entry = session.entries[session.cursor];
  const correct = checkAnswer(entry.task, answer);
  const entries =
    !correct && !entry.retry
      ? [...session.entries, { task: entry.task, retry: true }]
      : session.entries;
  return {
    ...session,
    entries,
    attempts: [
      ...session.attempts,
      { taskId: entry.task.id, answer, correct, assisted: session.hintOpen, retry: entry.retry },
    ],
    feedback: { correct },
  };
}
export function nextTask(session: Session): Session | null {
  if (!session.feedback) return session;
  if (session.cursor + 1 === session.entries.length) return null;
  return { ...session, cursor: session.cursor + 1, feedback: null, hintOpen: false };
}
export function sessionResult(session: Session, today = dayKey()): LessonResult {
  const first = session.attempts.filter((a) => !a.retry);
  const correct = first.filter((a) => a.correct).length;
  const unassisted = first.filter((a) => a.correct && !a.assisted).length;
  const assisted = first.filter((a) => a.assisted).length;
  const recovered = session.attempts.filter((a) => a.retry && a.correct).length;
  const xp =
    first.reduce((sum, a) => sum + (a.correct ? (a.assisted ? 5 : 10) : 2), 0) + recovered * 5;
  return {
    id: session.id,
    topicId: session.topicId,
    topicTitle: session.topicTitle,
    grade: session.grade,
    mode: session.mode,
    day: today,
    correct,
    total: session.initialCount,
    assisted,
    recovered,
    xp,
    stars:
      unassisted === session.initialCount ? 3 : unassisted / session.initialCount >= 0.6 ? 2 : 1,
  };
}
/** Commit once, and only after the last answer has been checked. */
export function finishSession(
  profile: Profile,
  session: Session,
  today = dayKey(),
): { profile: Profile; result: LessonResult } {
  const result = sessionResult(session, today);
  if (profile.history.some((r) => r.id === session.id))
    return { profile, result: profile.history.find((r) => r.id === session.id)! };
  if (session.attempts.length !== session.entries.length || !session.feedback)
    throw new Error('Нельзя завершить занятие до последнего ответа');
  const key = topicKey(session.grade, session.topicId);
  const old = profile.topics[key];
  const first = session.attempts.filter((a) => !a.retry);
  const pass = first.filter((a) => a.correct && !a.assisted).length / session.initialCount >= 0.8;
  const advance = pass && old?.lastAdvancedDay !== today;
  const level = Math.min(3, (old?.level ?? 0) + Number(advance));
  const mistakes = new Set(old?.mistakeIds ?? []);
  first.forEach((a) => {
    if (a.correct && !a.assisted) mistakes.delete(a.taskId);
    else mistakes.add(a.taskId);
  });
  const daily = profile.daily[today] ?? { tasks: 0, correct: 0, lessons: 0, xp: 0 };
  const nextDaily = {
    ...profile.daily,
    [today]: {
      tasks: daily.tasks + result.total,
      correct: daily.correct + result.correct,
      lessons: daily.lessons + 1,
      xp: daily.xp + result.xp,
    },
  };
  const cutoff = addDays(today, -730);
  return {
    result,
    profile: {
      ...profile,
      activeSession: null,
      topics: {
        ...profile.topics,
        [key]: {
          level,
          bestStars: Math.max(old?.bestStars ?? 0, result.stars),
          sessions: (old?.sessions ?? 0) + 1,
          correct: (old?.correct ?? 0) + result.correct,
          total: (old?.total ?? 0) + result.total,
          mistakeIds: [...mistakes],
          dueDay: addDays(today, pass ? [1, 1, 3, 7][level] : 1),
          lastDay: today,
          lastAdvancedDay: advance ? today : (old?.lastAdvancedDay ?? null),
        },
      },
      daily: Object.fromEntries(Object.entries(nextDaily).filter(([d]) => d >= cutoff)),
      totals: {
        tasks: profile.totals.tasks + result.total,
        correct: profile.totals.correct + result.correct,
        lessons: profile.totals.lessons + 1,
        xp: profile.totals.xp + result.xp,
        recovered: profile.totals.recovered + result.recovered,
        perfect: profile.totals.perfect + Number(result.stars === 3),
      },
      history: [...profile.history, result].slice(-180),
    },
  };
}
