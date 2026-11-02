import type { Task } from './content';
import type { Answer } from './model';

export function parseNumericAnswer(answer: string): number | null {
  const normalized = answer
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(/−/g, '-')
    .replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized) || normalized.length > 32) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}
export function checkAnswer(task: Task, answer: Answer): boolean {
  if (task.type === 'order')
    return (
      Array.isArray(answer) &&
      task.answer.length === answer.length &&
      task.answer.every((id, i) => id === answer[i])
    );
  if (task.type === 'division') {
    if (
      answer === null ||
      typeof answer !== 'object' ||
      Array.isArray(answer) ||
      typeof answer.quotient !== 'string' ||
      typeof answer.remainder !== 'string'
    )
      return false;
    const quotient = parseNumericAnswer(answer.quotient);
    const remainder = parseNumericAnswer(answer.remainder);
    return (
      quotient !== null &&
      remainder !== null &&
      Number.isInteger(quotient) &&
      Number.isInteger(remainder) &&
      quotient === task.answer.quotient &&
      remainder === task.answer.remainder
    );
  }
  if (typeof answer !== 'string') return false;
  if (task.type === 'number') {
    const value = parseNumericAnswer(answer);
    return value !== null && Math.abs(value - task.answer) <= (task.tolerance ?? 1e-9);
  }
  return task.answer === answer;
}
export function answerLabel(task: Task): string {
  switch (task.type) {
    case 'number':
      return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 10 }).format(task.answer)}${task.unit ? ` ${task.unit}` : ''}`;
    case 'division':
      return `${task.answer.quotient} (ост. ${task.answer.remainder})`;
    case 'choice':
      return task.options.find((o) => o.id === task.answer)?.label ?? '';
    case 'compare':
      return `${task.left} ${task.answer} ${task.right}`;
    case 'order':
      return task.answer.map((id) => task.items.find((i) => i.id === id)?.label ?? '').join(' → ');
  }
}
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function initialOrder(
  task: Extract<Task, { type: 'order' }>,
  random: () => number = Math.random,
): string[] {
  const result = shuffled(
    task.items.map((i) => i.id),
    random,
  );
  if (result.every((id, i) => id === task.answer[i])) result.push(result.shift()!);
  return result;
}
