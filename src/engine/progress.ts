import type { ContentPack, Grade, Topic } from './content';
import type { Profile } from './model';
import { addDays, dayKey } from './dates';
export const LEVEL_LABELS = ['Ещё не пробовал', 'Знакомлюсь', 'Тренируюсь', 'Умею'] as const;
export function topicKey(grade: Grade, topicId: string): string {
  return `${grade}:${topicId}`;
}
export function streak(profile: Profile, today = dayKey()): number {
  let cursor = profile.daily[today]?.lessons ? today : addDays(today, -1);
  let value = 0;
  while (profile.daily[cursor]?.lessons) {
    value++;
    cursor = addDays(cursor, -1);
  }
  return value;
}
export function dueTopics(profile: Profile, pack: ContentPack, today = dayKey()): Topic[] {
  return pack.topics
    .filter((t) => {
      const p = profile.topics[topicKey(pack.grade, t.id)];
      return p && p.dueDay <= today;
    })
    .sort((a, b) =>
      profile.topics[topicKey(pack.grade, a.id)].dueDay.localeCompare(
        profile.topics[topicKey(pack.grade, b.id)].dueDay,
      ),
    );
}
export function recommendedTopic(
  profile: Profile,
  pack: ContentPack,
  today = dayKey(),
): { topic: Topic; review: boolean } {
  const due = dueTopics(profile, pack, today);
  if (due.length) return { topic: due[0], review: true };
  const unseen = pack.topics.find((t) => !profile.topics[topicKey(pack.grade, t.id)]?.sessions);
  const ready = pack.topics.find((t) => {
    const p = profile.topics[topicKey(pack.grade, t.id)];
    return p && p.level < 3 && p.lastDay < today;
  });
  return { topic: unseen ?? ready ?? pack.topics[0], review: false };
}
export function gradeStats(profile: Profile, pack: ContentPack) {
  const started = pack.topics.filter(
    (t) => profile.topics[topicKey(pack.grade, t.id)]?.sessions,
  ).length;
  const mastered = pack.topics.filter(
    (t) => profile.topics[topicKey(pack.grade, t.id)]?.level === 3,
  ).length;
  const levels = pack.topics.reduce(
    (sum, t) => sum + (profile.topics[topicKey(pack.grade, t.id)]?.level ?? 0),
    0,
  );
  return { started, mastered, percent: Math.round((levels / (pack.topics.length * 3)) * 100) };
}
export const BADGES = [
  {
    id: 'first',
    title: 'Первый шаг',
    description: 'Завершить первое занятие',
    icon: 'footprints',
    color: 'sage',
    target: 1,
  },
  {
    id: 'ten',
    title: 'Всё сходится',
    description: 'Ответить верно на 10 заданий',
    icon: 'check',
    color: 'peach',
    target: 10,
  },
  {
    id: 'perfect',
    title: 'Точно в цель',
    description: 'Пройти занятие без ошибок и подсказок',
    icon: 'target',
    color: 'blue',
    target: 1,
  },
  {
    id: 'recovery',
    title: 'Не сдаюсь!',
    description: 'Разобраться с 5 ошибками в повторных заданиях',
    icon: 'sprout',
    color: 'butter',
    target: 5,
  },
  {
    id: 'week',
    title: 'Неделя открытий',
    description: 'Заниматься 7 дней подряд',
    icon: 'flame',
    color: 'peach',
    target: 7,
  },
  {
    id: 'master',
    title: 'Пять вершин',
    description: 'Достичь уровня «Умею» в 5 темах',
    icon: 'mountain',
    color: 'lavender',
    target: 5,
  },
] as const;
export function badgeValues(
  profile: Profile,
  today = dayKey(),
): Record<(typeof BADGES)[number]['id'], number> {
  // The longest historical streak keeps the badge unlocked after a rest day.
  const days = Object.keys(profile.daily)
    .filter((d) => profile.daily[d].lessons)
    .sort();
  let run = 0,
    longest = 0,
    previous = '';
  for (const d of days) {
    run = previous && addDays(previous, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = d;
  }
  return {
    first: profile.totals.lessons,
    ten: profile.totals.correct,
    perfect: profile.totals.perfect,
    recovery: profile.totals.recovered,
    week: Math.max(longest, streak(profile, today)),
    master: Object.values(profile.topics).filter((t) => t.level === 3).length,
  };
}
