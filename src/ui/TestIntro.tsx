import { ArrowRight, Clock, ListChecks } from 'lucide-react';

/**
 * The start sheet of the page-74 check. A test is a single check, not a step-based
 * explanation: the whole instruction is visible here, so there is no extra help toggle.
 */
export function TestIntro({
  count,
  minutes,
  started,
  onStart,
}: {
  count: number;
  minutes: number;
  started: boolean;
  onStart: () => void;
}) {
  return (
    <div className="test-intro">
      <p className="test-intro-lead">
        Задания по пройденным темам: вычисления, сравнение, задача и величины. Вопросы идут по
        порядку, как в книге.
      </p>
      <p className="test-intro-meta">
        <span>
          <ListChecks size={16} aria-hidden="true" />
          {count} заданий
        </span>
        <span>
          <Clock size={16} aria-hidden="true" />≈{minutes} минут
        </span>
      </p>
      <ol className="test-intro-list">
        <li>
          <span aria-hidden="true">1</span>
          <p>Прочитай условие и выбери один вариант ответа.</p>
        </li>
        <li>
          <span aria-hidden="true">2</span>
          <p>Если трудно, открой подсказку — она подскажет ход решения.</p>
        </li>
        <li>
          <span aria-hidden="true">3</span>
          <p>Проверь ответ и переходи дальше. В конце увидишь результат.</p>
        </li>
      </ol>
      <button data-autofocus className="button primary test-intro-start" onClick={onStart}>
        {started ? 'Пройти ещё раз' : 'Начать тест'}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
