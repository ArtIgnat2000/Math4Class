import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Flag,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
} from 'lucide-react';
import type { Grade, Task, Topic } from '../engine/content';
import type { Answer, LessonResult, Session, TopicProgress } from '../engine/model';
import { answerLabel, initialOrder, parseNumericAnswer } from '../engine/answers';
import { LEVEL_LABELS } from '../engine/progress';
import { referenceDescription } from '../engine/references';
import { MathVisual } from './MathVisual';
import { MassStory } from './MassStory';
import { Brand, InfoNote, Modal, ProgressBar, Stars, TopicOrigin, TopicSymbol } from './shared';

export function TopicDialog({
  topic,
  grade,
  isDemo,
  mode,
  progress,
  onClose,
  onStart,
}: {
  topic: Topic;
  grade: Grade;
  isDemo: boolean;
  mode: Session['mode'];
  progress?: TopicProgress;
  onClose: () => void;
  onStart: () => void;
}) {
  return (
    <Modal
      title={topic.title}
      eyebrow={`${grade} КЛАСС · ${mode === 'review' ? 'ПОВТОРЯЕМ И ЗАКРЕПЛЯЕМ' : mode === 'practice' ? 'СВОБОДНАЯ ТРЕНИРОВКА' : 'НОВОЕ МАЛЕНЬКОЕ ОТКРЫТИЕ'}`}
      onClose={onClose}
      className="topic-dialog"
    >
      <div className="topic-dialog-overview">
        <TopicSymbol symbol={topic.symbol} color={topic.color} large />
        <div>
          <p>{topic.description}</p>
          <span className="lesson-meta">
            <span>
              <BookOpen size={14} />
              {Math.min(topic.lessonSize, topic.tasks.length)} заданий
            </span>
            <span>
              <Clock3 size={14} />~{topic.minutes} минут
            </span>
            <span>Без таймера</span>
          </span>
        </div>
      </div>
      <TopicOrigin topic={topic} />
      {topic.reference && (
        <p className="topic-source-note">{referenceDescription(topic.reference)}</p>
      )}
      {topic.id === 'mass-kg-g' && <MassStory />}
      <div className="theory-card">
        <span className="theory-label">
          <Lightbulb size={17} />
          Сначала разберёмся
        </span>
        <h3>{topic.theory.title}</h3>
        <p>{topic.theory.text}</p>
        <div className="theory-example">
          <span>Например</span>
          {topic.theory.example}
        </div>
        <MathVisual expression={topic.theory.example} />
      </div>
      <div className="topic-dialog-level">
        <span>
          <span className="eyebrow">ТВОЯ СТУПЕНЬ</span>
          <strong>{LEVEL_LABELS[progress?.level ?? 0]}</strong>
        </span>
        <div className="level-ladder">
          {[1, 2, 3].map((step, i) => (
            <span
              key={step}
              className={(progress?.level ?? 0) >= step ? 'complete' : ''}
              title={LEVEL_LABELS[step]}
            >
              {(progress?.level ?? 0) >= step ? <Check size={14} /> : i + 1}
            </span>
          ))}
        </div>
      </div>
      <button data-autofocus className="button primary full-width" onClick={onStart}>
        {mode === 'review'
          ? 'Начать повторение'
          : mode === 'practice'
            ? 'Потренироваться'
            : 'Давай попробуем'}
        <ArrowRight size={18} />
      </button>
      <p className="dialog-footnote">
        {isDemo ? 'Демо-тема для знакомства с тренажёром. ' : ''}Если будет непросто — подсказка
        рядом.
      </p>
    </Modal>
  );
}
function Diagram({ diagram }: { diagram: NonNullable<Task['diagram']> }) {
  if (diagram.type === 'rectangle')
    return (
      <svg
        className="task-diagram rectangle-diagram"
        viewBox="0 0 300 160"
        role="img"
        aria-label={`Прямоугольник. Длина ${diagram.widthLabel}, ширина ${diagram.heightLabel}.`}
      >
        <rect
          x="48"
          y="34"
          width="190"
          height="95"
          rx="2"
          fill="#e7eee2"
          stroke="#60846c"
          strokeWidth="2"
        />
        <path d="M48 115h14v14" fill="none" stroke="#60846c" strokeWidth="1.5" />
        <path d="M48 20h190M254 34v95" stroke="#b6c5b2" strokeWidth="1" />
        <text x="143" y="15" textAnchor="middle" fill="#466549" fontSize="15">
          {diagram.widthLabel}
        </text>
        <text x="266" y="86" fill="#466549" fontSize="14">
          {diagram.heightLabel}
        </text>
      </svg>
    );
  if (diagram.type === 'square-parts')
    return (
      <svg
        className="task-diagram square-diagram"
        viewBox="0 0 240 210"
        role="img"
        aria-label={`Квадрат со стороной ${diagram.sideLabel} разделён на ${diagram.parts} равных треугольника.`}
      >
        <rect
          x="50"
          y="35"
          width="140"
          height="140"
          fill="#eef4e5"
          stroke="#60846c"
          strokeWidth="2"
        />
        <path d={diagram.parts === 4 ? 'M50 35H190L120 105Z' : 'M50 35H190V175Z'} fill="#e8c5a1" />
        <path
          d={diagram.parts === 4 ? 'M50 35L190 175M190 35L50 175' : 'M50 35L190 175'}
          fill="none"
          stroke="#60846c"
          strokeWidth="2"
        />
        <path d="M50 159h16v16" fill="none" stroke="#60846c" strokeWidth="1.5" />
        <text x="120" y="22" textAnchor="middle" fill="#466549" fontSize="16">
          {diagram.sideLabel}
        </text>
      </svg>
    );
  const sectors = Array.from({ length: diagram.parts }, (_, i) => {
    const start = (i * Math.PI * 2) / diagram.parts - Math.PI / 2;
    const end = ((i + 1) * Math.PI * 2) / diagram.parts - Math.PI / 2;
    return `M90 90 L${90 + 67 * Math.cos(start)} ${90 + 67 * Math.sin(start)} A67 67 0 0 1 ${90 + 67 * Math.cos(end)} ${90 + 67 * Math.sin(end)} Z`;
  });
  return (
    <svg
      className="task-diagram fraction-diagram"
      viewBox="0 0 180 180"
      role="img"
      aria-label={`Круг разделён на ${diagram.parts} равных частей. Закрашено ${diagram.shaded}.`}
    >
      {sectors.map((path, i) => (
        <path
          key={i}
          d={path}
          fill={i < diagram.shaded ? '#e8a367' : '#f8edda'}
          stroke="#fffdf8"
          strokeWidth="3"
        />
      ))}
    </svg>
  );
}
function TaskArea({
  session,
  onSubmit,
  onHint,
  onNext,
}: {
  session: Session;
  onSubmit: (answer: Answer) => void;
  onHint: () => void;
  onNext: () => void;
}) {
  const entry = session.entries[session.cursor];
  const task = entry.task;
  const previous = session.feedback ? session.attempts.at(-1)?.answer : undefined;
  const [answer, setAnswer] = useState<Answer>(
    () =>
      previous ??
      (task.type === 'order'
        ? initialOrder(task)
        : task.type === 'division'
          ? { quotient: '', remainder: '' }
          : ''),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const checked = session.feedback !== null;
  const divisionAnswer =
    typeof answer === 'object' && !Array.isArray(answer) ? answer : { quotient: '', remainder: '' };
  const canSubmit =
    task.type === 'division'
      ? [divisionAnswer.quotient, divisionAnswer.remainder].every((value) => {
          const number = parseNumericAnswer(value);
          return number !== null && Number.isInteger(number) && number >= 0;
        })
      : task.type === 'number'
        ? typeof answer === 'string' && parseNumericAnswer(answer) !== null
        : (typeof answer === 'string' || Array.isArray(answer)) && answer.length > 0;
  useEffect(() => {
    if (checked) feedbackRef.current?.focus();
    else if (inputRef.current) inputRef.current.focus();
    else controlsRef.current?.querySelector('button')?.focus();
  }, [checked]);
  const move = (index: number, direction: -1 | 1) => {
    if (!Array.isArray(answer)) return;
    const next = [...answer];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setAnswer(next);
  };
  return (
    <form
      className="task-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (checked) onNext();
        else if (canSubmit) onSubmit(answer);
      }}
    >
      <div className="task-content">
        <span className="task-kind-label">
          {entry.retry ? (
            <>
              <RotateCcw size={14} />
              Ещё одна попытка — у тебя получится
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {task.type === 'division'
                ? 'Найди частное и остаток'
                : task.type === 'number'
                  ? 'Найди ответ'
                  : task.type === 'choice'
                    ? 'Выбери ответ'
                    : task.type === 'compare'
                      ? 'Сравни'
                      : 'Расставь по порядку'}
            </>
          )}
        </span>
        <h1>{task.question}</h1>
        {session.topicId === 'mass-kg-g' && (
          <MassStory taskId={task.id} correct={session.feedback?.correct} hint={task.hint} />
        )}
        {task.diagram && <Diagram diagram={task.diagram} />}
        {!task.diagram && task.expression && <MathVisual expression={task.expression} />}
        {task.expression && (
          <div className="task-expression">
            {task.expression}
            <span>= ?</span>
          </div>
        )}
        {task.type === 'division' && (
          <div className="task-expression">
            {task.dividend.toLocaleString('ru-RU')} : {task.divisor.toLocaleString('ru-RU')}{' '}
            <span>= ?</span>
          </div>
        )}
        <div className="answer-controls" ref={controlsRef}>
          {task.type === 'division' && (
            <fieldset className="division-answer" disabled={checked}>
              <legend className="sr-only">Ответ на деление с остатком</legend>
              <div className="division-fields">
                <label htmlFor="quotient-answer">
                  Неполное частное
                  <input
                    ref={inputRef}
                    id="quotient-answer"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={32}
                    value={divisionAnswer.quotient}
                    onChange={(e) => setAnswer({ ...divisionAnswer, quotient: e.target.value })}
                    aria-describedby="division-help"
                    placeholder="Частное"
                  />
                </label>
                <label htmlFor="remainder-answer">
                  Остаток
                  <input
                    id="remainder-answer"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={32}
                    value={divisionAnswer.remainder}
                    onChange={(e) => setAnswer({ ...divisionAnswer, remainder: e.target.value })}
                    aria-describedby="division-help"
                    placeholder="Остаток"
                  />
                </label>
              </div>
              <p id="division-help">
                Введи два целых неотрицательных числа. Если остатка нет — напиши 0.
              </p>
            </fieldset>
          )}
          {task.type === 'number' && (
            <div className="number-answer">
              <label className="sr-only" htmlFor="numeric-answer">
                Твой ответ
              </label>
              <input
                ref={inputRef}
                id="numeric-answer"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                maxLength={32}
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={checked}
                placeholder="Твой ответ"
                aria-describedby="answer-help"
              />
              {task.unit && <span>{task.unit}</span>}
              <small id="answer-help">Можно писать с пробелами: 12 000</small>
            </div>
          )}
          {task.type === 'choice' && (
            <div className="choice-options">
              {task.options.map((option, i) => (
                <button
                  type="button"
                  key={option.id}
                  disabled={checked}
                  aria-pressed={answer === option.id}
                  className={`choice-option ${answer === option.id ? 'selected' : ''} ${checked && task.answer === option.id ? 'correct-option' : ''} ${checked && answer === option.id && !session.feedback?.correct ? 'wrong-option' : ''}`}
                  onClick={() => setAnswer(option.id)}
                >
                  <span>{String.fromCharCode(1040 + i)}</span>
                  <strong>{option.label}</strong>
                  {checked && task.answer === option.id && <Check size={19} />}
                </button>
              ))}
            </div>
          )}
          {task.type === 'compare' && (
            <div className="compare-answer">
              <div className="compare-expressions">
                <span>{task.left}</span>
                <span className="compare-placeholder">
                  {typeof answer === 'string' && answer ? answer : '?'}
                </span>
                <span>{task.right}</span>
              </div>
              <div className="compare-options" role="group" aria-label="Знак сравнения">
                {(['<', '=', '>'] as const).map((sign) => (
                  <button
                    type="button"
                    disabled={checked}
                    key={sign}
                    aria-label={sign === '<' ? 'Меньше' : sign === '>' ? 'Больше' : 'Равно'}
                    aria-pressed={answer === sign}
                    className={answer === sign ? 'selected' : ''}
                    onClick={() => setAnswer(sign)}
                  >
                    {sign}
                  </button>
                ))}
              </div>
            </div>
          )}
          {task.type === 'order' && Array.isArray(answer) && (
            <div className="order-answer">
              <p>Меняй элементы местами с помощью стрелок</p>
              <ol>
                {answer.map((id, i) => {
                  const item = task.items.find((t) => t.id === id)!;
                  return (
                    <li key={id}>
                      <span className="order-position">{i + 1}</span>
                      <strong>{item.label}</strong>
                      <div>
                        <button
                          type="button"
                          disabled={checked || i === 0}
                          onClick={() => move(i, -1)}
                          aria-label={`Поднять ${item.label}`}
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button
                          type="button"
                          disabled={checked || i === answer.length - 1}
                          onClick={() => move(i, 1)}
                          aria-label={`Опустить ${item.label}`}
                        >
                          <ArrowDown size={18} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
        {!checked && (
          <div className="hint-area">
            {session.hintOpen ? (
              <aside className="task-hint">
                <Lightbulb size={20} />
                <p>{task.hint}</p>
              </aside>
            ) : (
              <button className="hint-button" type="button" onClick={onHint}>
                <Lightbulb size={17} />
                Нужна подсказка?
              </button>
            )}
          </div>
        )}
      </div>
      {checked && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          role="status"
          className={`answer-feedback ${session.feedback?.correct ? 'is-correct' : 'is-learning'}`}
        >
          <span className="feedback-icon">
            {session.feedback?.correct ? <CircleCheck size={25} /> : <Lightbulb size={25} />}
          </span>
          <div>
            <strong>
              {session.feedback?.correct
                ? entry.retry
                  ? 'Вот теперь получилось!'
                  : 'Всё верно. Отличная работа!'
                : 'Почти! Давай разберёмся.'}
            </strong>
            {!session.feedback?.correct && (
              <span className="correct-answer-label">Правильный ответ: {answerLabel(task)}</span>
            )}
            <p>{task.explanation}</p>
            {!session.feedback?.correct && !entry.retry && (
              <small>Это задание ещё встретится — попробуешь снова.</small>
            )}
          </div>
        </div>
      )}
      <div className="task-footer">
        <span>
          {checked ? (
            'Понимание важнее скорости'
          ) : (
            <>
              <span className="keyboard-key">↵</span>Enter — проверить ответ
            </>
          )}
        </span>
        <button className="button primary" type="submit" disabled={!checked && !canSubmit}>
          {checked
            ? session.cursor + 1 === session.entries.length
              ? 'Завершить занятие'
              : 'Дальше'
            : 'Проверить'}
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
export function Lesson({
  session,
  onChange,
  onSubmit,
  onNext,
  onExit,
}: {
  session: Session;
  onChange: (session: Session) => void;
  onSubmit: (answer: Answer) => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const retry = session.entries[session.cursor].retry;
  return (
    <div className="lesson-shell">
      <header className="lesson-header">
        <button
          className="brand-button"
          onClick={onExit}
          aria-label="На главную, сохранить занятие"
        >
          <Brand small />
        </button>
        <span className="lesson-header-topic">
          {session.grade} класс
          <ChevronRight size={14} />
          <strong>{session.topicTitle}</strong>
        </span>
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={16} />
          Сохранить и выйти
        </button>
      </header>
      <main className="lesson-main">
        <div className="lesson-progress-label">
          <span>
            {session.mode === 'review'
              ? 'Повторяем и закрепляем'
              : session.mode === 'practice'
                ? 'Свободная тренировка'
                : 'Маленький шаг к большому открытию'}
          </span>
          <strong>
            {retry ? 'Закрепляем' : `Задание ${session.cursor + 1} из ${session.initialCount}`}
          </strong>
        </div>
        <ProgressBar
          value={(Math.min(session.initialCount, session.cursor) / session.initialCount) * 100}
          label="Прогресс занятия"
        />
        <TaskArea
          key={`${session.id}:${session.cursor}`}
          session={session}
          onSubmit={onSubmit}
          onHint={() => onChange({ ...session, hintOpen: true })}
          onNext={onNext}
        />
        <p className="lesson-reassurance">
          <SproutIcon />
          Без таймера. Без плохих оценок. В своём темпе.
        </p>
      </main>
    </div>
  );
}
function SproutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 16V9M9 12C3 12 2 9 2 5c5 0 7 3 7 7Zm0-3c0-5 3-7 7-7 0 5-2 7-7 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Result({
  result,
  onHome,
  onTopics,
}: {
  result: LessonResult;
  onHome: () => void;
  onTopics: () => void;
}) {
  return (
    <div className="lesson-shell result-shell">
      <header className="lesson-header">
        <button className="brand-button" onClick={onHome}>
          <Brand small />
        </button>
        <button className="text-button" onClick={onHome}>
          На главную
          <ArrowRight size={16} />
        </button>
      </header>
      <main className="result-main">
        <div className="result-art">
          <span className="result-spark spark-1">✦</span>
          <span className="result-spark spark-2">✧</span>
          <span className="result-spark spark-3">✦</span>
          <div className="result-medal">
            <Star size={60} strokeWidth={1.4} />
          </div>
          <div className="result-ribbon left" />
          <div className="result-ribbon right" />
        </div>
        <span className="eyebrow">ЕЩЁ ОДНО МАЛЕНЬКОЕ ОТКРЫТИЕ</span>
        <h1>{result.stars === 3 ? 'Всё получилось!' : 'Ты стал на шаг увереннее!'}</h1>
        <p className="result-topic">
          {result.topicTitle} · {result.grade} класс
        </p>
        <Stars count={result.stars} size={34} />
        <div className="result-stats">
          <div>
            <span className="tone-sage">
              <TargetIcon />
            </span>
            <strong>
              {result.correct}
              <small>/{result.total}</small>
            </strong>
            <p>с первого раза</p>
          </div>
          <div>
            <span className="tone-peach">
              <Star size={22} />
            </span>
            <strong>+{result.xp}</strong>
            <p>очков опыта</p>
          </div>
          <div>
            <span className="tone-lavender">
              <Flag size={22} />
            </span>
            <strong>{result.total}</strong>
            <p>заданий пройдено</p>
          </div>
        </div>
        {result.recovered > 0 && (
          <div className="recovery-note">
            <RotateCcw size={19} />
            <p>
              Ты разобрался с {result.recovered} {result.recovered === 1 ? 'заданием' : 'заданиями'}{' '}
              после ошибки. Это и есть настоящее обучение!
            </p>
          </div>
        )}
        <InfoNote icon="check">
          {result.stars === 3
            ? 'Уверенный шаг! Вернись к теме в другой день — так знания станут прочнее.'
            : 'Не всё должно получаться сразу. К непростым заданиям мы вернёмся в повторении.'}
        </InfoNote>
        <div className="result-actions">
          <button className="button primary" onClick={onHome}>
            Отлично, на главную
            <ArrowRight size={18} />
          </button>
          <button className="button secondary" onClick={onTopics}>
            Выбрать другую тему
          </button>
        </div>
        <p className="dialog-footnote">Завершённое занятие сохранено в этом браузере.</p>
      </main>
    </div>
  );
}
function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}
