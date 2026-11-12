import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleCheck,
  Gift,
  Lightbulb,
  Star,
  X,
} from 'lucide-react';
import type { Task, Topic } from '../engine/content';
import type { Answer, LessonResult, Session, TopicProgress } from '../engine/model';
import { answerLabel, initialOrder, parseNumericAnswer } from '../engine/answers';
import { parseColumnChoice } from '../engine/column-choice';
import { LEVEL_LABELS } from '../engine/progress';
import { MathVisual } from './MathVisual';
import { MassStory } from './MassStory';
import { MassIntroVisual } from './MassIntroVisual';
import { CentnerIntroVisual } from './CentnerIntroVisual';
import { CentnerQuestionVisual } from './CentnerQuestionVisual';
import { MassComparisonIntro } from './MassComparisonIntro';
import { ComparisonChoicePicture, MassComparisonVisual } from './MassComparisonVisual';
import { MassWordIntro, MassWordVisual } from './MassWordVisual';
import { CalendarIntro, CalendarVisual } from './CalendarVisual';
import { YearMonthsPilot } from './YearMonthsPilot';
import { ClockPilot } from './ClockPilot';
import { SpokenClockPilot } from './SpokenClockPilot';
import { RomanNumeralsPilot } from './RomanNumeralsPilot';
import { EquationPilot } from './EquationPilot';
import { DividendPilot } from './DividendPilot';
import { AreaPilot } from './AreaPilot';
import { DecimalPilot } from './DecimalPilot';
import { TimeUnitsTable } from './TimeUnitsTable';
import { TestIntro } from './TestIntro';
import { NumericInput } from './NumericInput';
import { ColumnChoice } from './ColumnChoice';
import { NumericKeypad } from './NumericKeypad';
import { CardGuide, CardTitleContext } from './CardGuide';
import type { RewardItem } from '../engine/rewards';
import { StepIndicator } from './StepIndicator';
import { OrderAnswer } from './OrderAnswer';
import { Brand, Modal, ProgressBar, Stars, TopicSymbol } from './shared';
import { rewardArtUrl } from './RewardCollection';
import { REWARD_SHELVES } from '../engine/rewards';

/**
 * A theory example is only safe when it does not spell out the answer of a task
 * the child is about to face. Three approved topics currently reuse a textbook
 * exercise as their example, so the example is withheld for them.
 */
export function safeTheoryExample(topic: Topic): string | null {
  const example = topic.theory.example;
  const numbers = new Set(example.match(/\d+/g) ?? []);
  const leaks = topic.tasks.some(
    (task) => typeof task.answer === 'number' && numbers.has(String(task.answer)),
  );
  return leaks ? null : example;
}

function TheoryCard({ topic }: { topic: Topic }) {
  const example = safeTheoryExample(topic);
  return (
    <div className="theory-card">
      <h3>{topic.theory.title}</h3>
      <p>{topic.theory.text}</p>
      {example && (
        <>
          <div className="theory-example">{example}</div>
          <MathVisual expression={example} />
        </>
      )}
    </div>
  );
}

/** Short dialog title: the full topic name stays in the catalog and lesson header. */
const PILOT_DIALOG_TITLE = 'Годы в месяцы';

/** Interactive explanations own a short one-line dialog title (CARD-02). */
const PILOT_TITLES: Record<string, string> = {
  'calendar-years-months': PILOT_DIALOG_TITLE,
  'time-units-table': 'Единицы времени',
  'clock-day-hours': 'Время суток',
  'clock-spoken-time': 'Время словами',
  'roman-numerals': 'Римские цифры',
  'equations-add-subtract': 'Уравнения',
  'division-restore-dividend': 'Деление с остатком',
  'area-equal-parts': 'Площадь частей',
  'multiply-divide-powers-ten': 'Умножаем и делим',
  'place-value-calculations': 'Разряды',
};

/** The same explanation, reachable from a task without restarting the session. */
function TaskReference({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  // Always reachable, on every step of the explanation, so a child is never trapped.
  const back = (
    <button
      type="button"
      className="button secondary full-width task-reference-back"
      onClick={onClose}
    >
      <ArrowLeft size={18} aria-hidden="true" /> К заданию
    </button>
  );
  return (
    <Modal
      title={PILOT_TITLES[topic.id] ?? topic.title}
      onClose={onClose}
      className={`topic-dialog mass-intro-dialog task-reference-dialog ${topic.id === 'time-units-table' ? 'time-units-dialog' : ''}`}
    >
      {topic.id === 'time-units-table' ? (
        <>
          <CardGuide kind="Теория" inlineHelp>
            Нажми на картинку единицы времени, чтобы открыть её крупнее и прочитать короткое
            пояснение.
          </CardGuide>
          <TimeUnitsTable />
        </>
      ) : topic.id === 'clock-spoken-time' ? (
        <SpokenClockPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : topic.id === 'clock-day-hours' ? (
        <ClockPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : topic.id === 'calendar-years-months' ? (
        <YearMonthsPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : topic.id === 'roman-numerals' ? (
        <RomanNumeralsPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : topic.id === 'multiply-divide-powers-ten' || topic.id === 'place-value-calculations' ? (
        <DecimalPilot
          kind={topic.id === 'multiply-divide-powers-ten' ? 'powers' : 'place'}
          onPractice={onClose}
          practiceLabel="Вернуться к заданию"
        />
      ) : topic.id === 'area-equal-parts' ? (
        <AreaPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : topic.id === 'division-restore-dividend' ? (
        <DividendPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : topic.id === 'equations-add-subtract' ? (
        <EquationPilot onPractice={onClose} practiceLabel="Вернуться к заданию" />
      ) : (
        <>
          <CardGuide kind="Теория">
            Изучи рисунок или правило. Попробуй доступные кнопки, затем вернись к заданию.
          </CardGuide>
          {topic.id.startsWith('calendar-') ? (
            <CalendarIntro />
          ) : topic.id === 'mass-kg-g' ? (
            <MassIntroVisual />
          ) : topic.id === 'mass-tonne-centner' ? (
            <CentnerIntroVisual />
          ) : topic.id === 'mass-conversion-comparison' ? (
            <MassComparisonIntro />
          ) : topic.id === 'mass-word-problems' ? (
            <MassWordIntro />
          ) : (
            <TheoryCard topic={topic} />
          )}
        </>
      )}
      {back}
    </Modal>
  );
}

export function TopicDialog({
  topic,
  isDemo,
  mode,
  progress,
  onClose,
  onStart,
}: {
  topic: Topic;
  isDemo: boolean;
  mode: Session['mode'];
  progress?: TopicProgress;
  onClose: () => void;
  onStart: () => void;
}) {
  if (topic.id === 'clock-spoken-time')
    return (
      <Modal
        title={PILOT_TITLES[topic.id]}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog"
      >
        <SpokenClockPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'clock-day-hours')
    return (
      <Modal
        title={PILOT_TITLES[topic.id]}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog"
      >
        <ClockPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'calendar-years-months')
    return (
      <Modal
        title={PILOT_DIALOG_TITLE}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog"
      >
        <YearMonthsPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'roman-numerals')
    return (
      <Modal
        title={PILOT_TITLES['roman-numerals']}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog roman-dialog"
      >
        <RomanNumeralsPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'multiply-divide-powers-ten' || topic.id === 'place-value-calculations')
    return (
      <Modal
        title={PILOT_TITLES[topic.id]}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog"
      >
        <DecimalPilot
          kind={topic.id === 'multiply-divide-powers-ten' ? 'powers' : 'place'}
          onPractice={onStart}
        />
      </Modal>
    );
  if (topic.id === 'area-equal-parts')
    return (
      <Modal
        title={PILOT_TITLES[topic.id]}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog"
      >
        <AreaPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'division-restore-dividend')
    return (
      <Modal
        title={PILOT_TITLES[topic.id]}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog"
      >
        <DividendPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'equations-add-subtract')
    return (
      <Modal
        title={PILOT_TITLES[topic.id]}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog year-month-dialog equation-dialog"
      >
        <EquationPilot onPractice={onStart} />
      </Modal>
    );
  if (topic.id === 'page-74-test')
    return (
      <Modal
        title="Проверим себя"
        eyebrow="Проверочная работа"
        onClose={onClose}
        className="topic-dialog test-intro-dialog"
      >
        <TestIntro
          count={topic.tasks.length}
          minutes={topic.minutes}
          started={Boolean(progress?.sessions)}
          onStart={onStart}
        />
      </Modal>
    );
  if (topic.id === 'time-units-table')
    return (
      <Modal
        title={PILOT_TITLES[topic.id] ?? topic.title}
        onClose={onClose}
        className="topic-dialog mass-intro-dialog time-units-dialog"
      >
        <CardGuide kind="Теория" inlineHelp>
          Нажми на картинку единицы времени, чтобы открыть её крупнее и прочитать короткое
          пояснение.
        </CardGuide>
        <TimeUnitsTable />
        <button className="button primary full-width" onClick={onStart}>
          {mode === 'review'
            ? 'Начать повторение'
            : mode === 'practice'
              ? 'Потренироваться'
              : 'Начать занятие'}
          <ArrowRight size={18} />
        </button>
      </Modal>
    );
  if (topic.id.startsWith('calendar-'))
    return (
      <Modal title={topic.title} onClose={onClose} className="topic-dialog mass-intro-dialog">
        <CardGuide kind="Теория">
          Изучи рисунок и попробуй доступные кнопки. Когда будешь готов, начни занятие.
        </CardGuide>
        <CalendarIntro />
        <button data-autofocus className="button primary full-width" onClick={onStart}>
          {mode === 'review'
            ? 'Начать повторение'
            : mode === 'practice'
              ? 'Потренироваться'
              : 'Начать занятие'}
          <ArrowRight size={18} />
        </button>
      </Modal>
    );
  if (topic.id === 'mass-word-problems')
    return (
      <Modal title={topic.title} onClose={onClose} className="topic-dialog mass-intro-dialog">
        <CardGuide kind="Теория">
          Изучи рисунок и попробуй доступные кнопки. Когда будешь готов, начни занятие.
        </CardGuide>
        <MassWordIntro />
        <button data-autofocus className="button primary full-width" onClick={onStart}>
          {mode === 'review'
            ? 'Начать повторение'
            : mode === 'practice'
              ? 'Потренироваться'
              : 'Начать занятие'}
          <ArrowRight size={18} />
        </button>
      </Modal>
    );
  if (topic.id === 'mass-conversion-comparison')
    return (
      <Modal title={topic.title} onClose={onClose} className="topic-dialog mass-intro-dialog">
        <CardGuide kind="Теория">
          Изучи рисунок и попробуй доступные кнопки. Когда будешь готов, начни занятие.
        </CardGuide>
        <MassComparisonIntro />
        <button data-autofocus className="button primary full-width" onClick={onStart}>
          {mode === 'review'
            ? 'Начать повторение'
            : mode === 'practice'
              ? 'Потренироваться'
              : 'Начать занятие'}
          <ArrowRight size={18} />
        </button>
      </Modal>
    );
  if (topic.id === 'mass-kg-g' || topic.id === 'mass-tonne-centner')
    return (
      <Modal title={topic.title} onClose={onClose} className="topic-dialog mass-intro-dialog">
        <CardGuide kind="Теория">
          Изучи рисунок и попробуй доступные кнопки. Когда будешь готов, начни занятие.
        </CardGuide>
        {topic.id === 'mass-kg-g' ? <MassIntroVisual /> : <CentnerIntroVisual />}
        <button data-autofocus className="button primary full-width" onClick={onStart}>
          {mode === 'review'
            ? 'Начать повторение'
            : mode === 'practice'
              ? 'Потренироваться'
              : 'Начать занятие'}
          <ArrowRight size={18} />
        </button>
      </Modal>
    );
  return (
    <Modal title={topic.title} onClose={onClose} className="topic-dialog">
      <CardGuide kind="Теория">
        Изучи правило и пример, если он показан. Затем начни занятие.
      </CardGuide>
      <div className="topic-dialog-overview">
        <TopicSymbol symbol={topic.symbol} color={topic.color} large />
        <div>
          <span className="lesson-meta">
            <span>
              <BookOpen size={14} />
              {Math.min(topic.lessonSize, topic.tasks.length)} заданий
            </span>
          </span>
        </div>
      </div>
      <TheoryCard topic={topic} />
      <div className="topic-dialog-level">
        <span>
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
      {isDemo && <p className="dialog-footnote">Демо-тема</p>}
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
  topic,
  onSubmit,
  onHint,
  onNext,
  onExit,
}: {
  session: Session;
  topic?: Topic;
  onSubmit: (answer: Answer) => void;
  onHint: () => void;
  onNext: () => void;
  onExit: () => void;
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
  const remainderRef = useRef<HTMLInputElement>(null);
  const [activeNumericField, setActiveNumericField] = useState<'quotient' | 'remainder'>(
    'quotient',
  );
  const touchKeyboard =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const controlsRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [titleSlot, setTitleSlot] = useState<HTMLSpanElement | null>(null);
  const checked = session.feedback !== null;
  const retryCount = session.entries.filter((item) => item.retry).length;
  const currentStep = entry.retry ? session.cursor - session.initialCount : session.cursor;
  const stepCount = entry.retry ? retryCount : session.initialCount;
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
  return (
    <form
      className={`task-card ${session.topicId === 'mass-kg-g' ? 'mass-task-card' : ''} ${session.topicId === 'mass-conversion-comparison' ? 'comparison-task-card' : ''} ${session.topicId === 'page-74-test' ? 'test-task-card' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (checked) onNext();
        else if (canSubmit) onSubmit(answer);
      }}
    >
      <div className="task-content">
        <div className="task-card-top">
          <p className="task-card-title">
            <span>{PILOT_TITLES[session.topicId] ?? session.topicTitle}</span>
            <span ref={setTitleSlot} />
          </p>
          <button
            type="button"
            className="icon-button task-exit"
            onClick={onExit}
            aria-label="Сохранить и выйти"
            title="Сохранить и выйти"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <CardTitleContext.Provider value={titleSlot}>
          <CardGuide
            kind="Практика"
            leading={
              <StepIndicator
                count={stepCount}
                current={currentStep}
                label={
                  entry.retry
                    ? `Повторное задание ${currentStep + 1} из ${stepCount}`
                    : `Задание ${currentStep + 1} из ${stepCount}`
                }
              />
            }
          >
            {checked
              ? 'Посмотри результат и нажми «Дальше» или заверши занятие.'
              : task.type === 'number'
                ? 'Реши задание, введи число и нажми «Проверить».'
                : task.type === 'division'
                  ? 'Введи частное и остаток, затем нажми «Проверить».'
                  : task.type === 'order'
                    ? 'Перетащи карточки или передвинь стрелками. Затем нажми «Проверить».'
                    : task.type === 'compare'
                      ? 'Выбери знак сравнения и нажми «Проверить».'
                      : 'Выбери ответ и нажми «Проверить».'}
          </CardGuide>
        </CardTitleContext.Provider>
        {task.sourceNumber !== undefined && (
          <p className="task-source-number">Задание {task.sourceNumber}</p>
        )}
        <h1>{task.question}</h1>
        {session.topicId === 'mass-kg-g' && (
          <MassStory
            taskId={task.type === 'order' ? undefined : task.id}
            showWeightGuide={task.type === 'order'}
            correct={session.feedback?.correct}
            hint={task.hint}
            hintOpen={session.hintOpen}
            onHint={onHint}
          />
        )}
        {session.topicId === 'mass-tonne-centner' && task.type !== 'order' && (
          <CentnerQuestionVisual taskId={task.id} />
        )}
        {session.topicId === 'mass-conversion-comparison' && task.id !== 'heaviest' && (
          <MassComparisonVisual taskId={task.id} />
        )}
        {session.topicId === 'mass-word-problems' && <MassWordVisual taskId={task.id} />}
        {session.topicId.startsWith('calendar-') && task.type !== 'order' && (
          <CalendarVisual topicId={session.topicId} taskId={task.id} />
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
                  <NumericInput
                    inputRef={inputRef}
                    onFocus={() => setActiveNumericField('quotient')}
                    id="quotient-answer"
                    inputMode={touchKeyboard ? 'none' : 'numeric'}
                    value={divisionAnswer.quotient}
                    onChange={(value) => setAnswer({ ...divisionAnswer, quotient: value })}
                    describedBy="division-help"
                    placeholder="Частное"
                  />
                </label>
                <label htmlFor="remainder-answer">
                  Остаток
                  <NumericInput
                    inputRef={remainderRef}
                    onFocus={() => setActiveNumericField('remainder')}
                    id="remainder-answer"
                    inputMode={touchKeyboard ? 'none' : 'numeric'}
                    value={divisionAnswer.remainder}
                    onChange={(value) => setAnswer({ ...divisionAnswer, remainder: value })}
                    describedBy="division-help"
                    placeholder="Остаток"
                  />
                </label>
              </div>
              <p id="division-help">Нет остатка — введи 0.</p>
            </fieldset>
          )}
          {task.type === 'division' && !checked && (
            <NumericKeypad
              value={divisionAnswer[activeNumericField]}
              onChange={(value) => setAnswer({ ...divisionAnswer, [activeNumericField]: value })}
              inputRef={activeNumericField === 'quotient' ? inputRef : remainderRef}
              disabled={checked}
            />
          )}
          {task.type === 'number' && (
            <div className="number-answer">
              <label className="sr-only" htmlFor="numeric-answer">
                Твой ответ
              </label>
              <NumericInput
                inputRef={inputRef}
                id="numeric-answer"
                inputMode={touchKeyboard ? 'none' : 'decimal'}
                value={typeof answer === 'string' ? answer : ''}
                onChange={setAnswer}
                disabled={checked}
                placeholder="Ответ"
              />
              {task.unit && <span>{task.unit}</span>}
            </div>
          )}
          {task.type === 'number' && !checked && (
            <NumericKeypad
              value={typeof answer === 'string' ? answer : ''}
              onChange={setAnswer}
              inputRef={inputRef}
              allowDecimal={!Number.isInteger(task.answer)}
              allowNegative={task.answer < 0}
              disabled={checked}
            />
          )}
          {task.type === 'choice' && (
            <div className="choice-options">
              {task.options.map((option, i) => {
                // The page-74 test prints tasks 7–8 as columns; keep that layout.
                const column =
                  session.topicId === 'page-74-test' ? parseColumnChoice(option.label) : null;
                return (
                  <button
                    type="button"
                    key={option.id}
                    disabled={checked}
                    aria-pressed={answer === option.id}
                    className={`choice-option ${answer === option.id ? 'selected' : ''} ${checked && task.answer === option.id ? 'correct-option' : ''} ${checked && answer === option.id && !session.feedback?.correct ? 'wrong-option' : ''}`}
                    onClick={() => setAnswer(option.id)}
                  >
                    <span>{String.fromCharCode(1040 + i)}</span>
                    {column ? (
                      <>
                        <ColumnChoice layout={column} />
                        <strong className="sr-only">{option.label}</strong>
                      </>
                    ) : (
                      <>
                        {session.topicId === 'mass-conversion-comparison' && (
                          <ComparisonChoicePicture value={option.label} />
                        )}
                        <strong>{option.label}</strong>
                      </>
                    )}
                    {checked && task.answer === option.id && <Check size={19} />}
                  </button>
                );
              })}
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
            <OrderAnswer
              items={task.items}
              order={answer}
              onChange={setAnswer}
              disabled={checked}
              illustrated={
                session.topicId === 'mass-kg-g' ||
                session.topicId === 'mass-tonne-centner' ||
                session.topicId.startsWith('calendar-')
              }
              kind={
                session.topicId.startsWith('calendar-')
                  ? 'calendar'
                  : session.topicId === 'mass-tonne-centner'
                    ? 'centner'
                    : 'mass'
              }
              topicId={session.topicId}
            />
          )}
        </div>
        {!checked && (
          <div className="hint-area">
            <div className="task-help-row">
              {topic && (
                <button
                  className="hint-button"
                  type="button"
                  onClick={() => {
                    onHint();
                    setReferenceOpen(true);
                  }}
                >
                  <BookOpen size={17} aria-hidden="true" /> Объяснение
                </button>
              )}
              {session.topicId !== 'mass-kg-g' && !session.hintOpen && (
                <button className="hint-button" type="button" onClick={onHint}>
                  <Lightbulb size={17} aria-hidden="true" /> Подсказка
                </button>
              )}
            </div>
            {session.hintOpen && session.topicId !== 'mass-kg-g' && (
              <aside className="task-hint">
                <Lightbulb size={20} />
                <p>{task.hint}</p>
              </aside>
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
            <strong>{session.feedback?.correct ? 'Верно!' : 'Разберёмся.'}</strong>
            {!session.feedback?.correct && (
              <>
                <span className="correct-answer-label">Ответ: {answerLabel(task)}</span>
                <p>{task.explanation}</p>
              </>
            )}
          </div>
        </div>
      )}
      {referenceOpen && topic && (
        <TaskReference topic={topic} onClose={() => setReferenceOpen(false)} />
      )}
      <div className="task-footer">
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
  topic,
  onChange,
  onSubmit,
  onNext,
  onExit,
}: {
  session: Session;
  topic?: Topic;
  onChange: (session: Session) => void;
  onSubmit: (answer: Answer) => void;
  onNext: () => void;
  onExit: () => void;
}) {
  return (
    <div className="lesson-shell">
      <header className="lesson-header">
        <button
          className="brand-button"
          onClick={onExit}
          aria-label="число. — на главную, сохранить занятие"
        >
          <Brand small />
        </button>
        <span className="lesson-header-topic">
          <strong>{session.topicTitle}</strong>
        </span>
      </header>
      <main className="lesson-main">
        <ProgressBar
          value={(Math.min(session.initialCount, session.cursor) / session.initialCount) * 100}
          label="Прогресс занятия"
        />
        <TaskArea
          key={`${session.id}:${session.cursor}`}
          session={session}
          topic={topic}
          onSubmit={onSubmit}
          onHint={() => onChange({ ...session, hintOpen: true })}
          onNext={onNext}
          onExit={onExit}
        />
      </main>
    </div>
  );
}
export function Result({
  result,
  nextTopic,
  hasTopics,
  bonus,
  onNext,
  onHome,
  onTopics,
  onRewards,
}: {
  result: LessonResult;
  nextTopic?: Topic;
  hasTopics: boolean;
  /** Награды, открывшиеся именно на этом занятии (engine/rewards.ts). */
  bonus?: { lesson: number; items: RewardItem[] } | null;
  onNext: () => void;
  onHome: () => void;
  onTopics: () => void;
  onRewards?: () => void;
}) {
  const [openReward, setOpenReward] = useState<RewardItem | null>(null);
  const shelfTitle = openReward
    ? (REWARD_SHELVES.find((shelf) => shelf.id === openReward.shelf)?.title ?? '')
    : '';
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
        <h1>{result.stars === 3 ? 'Готово!' : 'Занятие завершено'}</h1>
        <p className="result-topic">{result.topicTitle}</p>
        <Stars count={result.stars} size={34} />
        <p className="result-summary">
          {result.correct} из {result.total} с первого раза
        </p>
        {bonus && bonus.items.length > 0 && (
          <section className="result-reward" aria-labelledby="result-reward-title">
            <p id="result-reward-title" className="result-reward-title">
              <Gift size={17} aria-hidden="true" />
              {bonus.items.length === 1 ? 'Твоя новая награда' : 'Твои новые награды'}
            </p>
            <ul className="result-reward-list">
              {bonus.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="result-reward-card"
                    onClick={() => setOpenReward(item)}
                    aria-haspopup="dialog"
                    aria-label={`Рассмотреть награду «${item.title}»`}
                  >
                    <img
                      src={rewardArtUrl(item.id)}
                      alt=""
                      width={480}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                    <span className="result-reward-card-text">
                      <strong>{item.title}</strong>
                      <small>Нажми, чтобы рассмотреть</small>
                    </span>
                    <ChevronRight className="result-reward-chevron" size={20} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {bonus.items.length > 1 && (
              <p className="result-reward-hint">Смахни карточки, чтобы увидеть все награды</p>
            )}
          </section>
        )}
        <p className="result-next">
          {nextTopic ? (
            <>
              Следующая тема: <strong>{nextTopic.title}</strong>
            </>
          ) : hasTopics ? (
            'Ты познакомился со всеми доступными темами.'
          ) : (
            'Пока нет доступных тем.'
          )}
        </p>
        <div className="result-actions">
          <button className="button primary" onClick={nextTopic ? onNext : onHome}>
            {nextTopic ? 'Дальше' : 'На главную'}
            <ArrowRight size={18} />
          </button>
          <button className="button secondary" onClick={onTopics}>
            Все темы
          </button>
        </div>
      </main>
      {openReward && (
        <Modal
          title={openReward.title}
          eyebrow="Твоя награда"
          onClose={() => setOpenReward(null)}
          className="reward-modal"
        >
          <img
            className="reward-modal-art"
            src={rewardArtUrl(openReward.id)}
            alt=""
            width={480}
            height={360}
            draggable={false}
          />
          <p className="reward-modal-meta">
            {shelfTitle ? `Коллекция «${shelfTitle}». ` : ''}Открылась за {openReward.need}-е
            занятие.
          </p>
          <p className="reward-modal-note">
            Награда уже твоя и осталась в разделе «Мои награды» — там вся коллекция.
          </p>
          <div className="reward-modal-actions">
            <button data-autofocus className="button primary" onClick={() => setOpenReward(null)}>
              Продолжить
            </button>
            {onRewards && (
              <button className="button secondary" onClick={onRewards}>
                Мои награды
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
