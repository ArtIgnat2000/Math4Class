import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import {
  EQUATION_SCENES,
  equationChoices,
  equationModel,
  type EquationCase,
} from '../engine/equation-model';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

const TITLES = ['Неизвестное слагаемое', 'Неизвестное уменьшаемое', 'Неизвестное вычитаемое'];

function EquationDiagram({ problem, reveal }: { problem: EquationCase; reveal: boolean }) {
  const model = equationModel(problem);
  return (
    <div
      className="equation-model"
      role="img"
      aria-label={`${model.equation}. Целое ${model.unknownPart === -1 && !reveal ? 'неизвестно' : model.whole}; части ${model.parts.map((part, i) => (i === model.unknownPart && !reveal ? 'неизвестная' : part)).join(' и ')}.`}
    >
      <div className="equation-whole">
        Целое: {model.unknownPart === -1 ? (reveal ? `x = ${model.whole}` : 'x') : model.whole}
      </div>
      <div className="equation-parts" aria-hidden="true">
        {model.parts.map((part, index) => (
          <div
            key={index}
            className={`equation-part ${model.unknownPart === index ? 'is-unknown' : ''}`}
            style={{ flexGrow: part }}
          >
            {model.unknownPart === index ? (reveal ? `x = ${part}` : 'x') : part}
          </div>
        ))}
      </div>
      <div className="equation-labels" aria-hidden="true">
        <span>часть</span>
        <span>часть</span>
      </div>
    </div>
  );
}

function EquationGame({ type, onExit }: { type: 'match' | 'sequence'; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [sequence, setSequence] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const problem = EQUATION_SCENES[round][0];
  const model = equationModel(problem);
  const solved = type === 'match' ? choice === model.unknown : sequence.length === 3;
  const cards = [`x = ${model.unknown}`, model.equation, model.calculation];
  const order = [1, 2, 0];
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, []);
  const clear = () => {
    setChoice(null);
    setSequence([]);
    setMessage('');
  };
  const restart = () => {
    setRound(0);
    clear();
  };
  const next = () => {
    setRound((value) => value + 1);
    clear();
  };
  const chooseCard = (index: number) => {
    if (index !== order[sequence.length]) {
      setMessage(
        sequence.length === 0
          ? 'Сначала найди исходное уравнение.'
          : sequence.length === 1
            ? 'Теперь выбери обратное действие.'
            : 'Теперь запиши значение x.',
      );
      return;
    }
    setSequence((items) => [...items, index]);
    setMessage(
      index === 1
        ? 'Теперь найди обратное действие.'
        : index === 2
          ? model.rule
          : `${model.calculation} = ${model.unknown}.`,
    );
  };
  return (
    <div className="equation-pilot year-game equation-game">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {type === 'match' ? 'Найди число' : 'Собери решение'}
      </h3>
      <CardGuide kind="Тренажёр">
        {type === 'match'
          ? 'Посмотри на схему. Выбери число вместо x. Игра не оценивается.'
          : 'Выбери карточки по порядку: уравнение, действие, значение x. Игра не оценивается.'}
      </CardGuide>
      {type === 'match' ? (
        <>
          <div className="equation-line">{model.equation}</div>
          <EquationDiagram problem={problem} reveal={solved} />
          <p className="equation-prompt">Чему равен x?</p>
          <div className="model-tools equation-choices" role="group" aria-label="Выбери значение x">
            {equationChoices(problem).map((value) => (
              <button
                type="button"
                key={value}
                className={`button ${choice === value ? 'tool-add' : 'tool-outline'}`}
                aria-pressed={choice === value}
                onClick={() => {
                  setChoice(value);
                  setMessage(
                    value === model.unknown
                      ? `${model.calculation} = ${model.unknown}.`
                      : model.rule,
                  );
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="equation-prompt">Собери решение по порядку</p>
          <div className="equation-sequence" aria-label="Собранное решение" role="group">
            {sequence.length ? (
              sequence.map((index) => <span key={index}>{cards[index]}</span>)
            ) : (
              <span>Выбери первую карточку</span>
            )}
          </div>
          <div
            className="model-tools equation-card-tray"
            role="group"
            aria-label="Карточки решения"
          >
            {cards.map((card, index) => (
              <button
                type="button"
                key={card}
                className="button tool-outline"
                aria-disabled={sequence.includes(index)}
                onClick={() => {
                  if (!sequence.includes(index)) chooseCard(index);
                }}
              >
                {card}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="equation-message" role="status">
        {message || (type === 'match' ? 'Нажми число.' : 'Нажимай карточки по порядку.')}
      </p>
      <div className="model-tools equation-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setMessage(
              type === 'match'
                ? model.rule
                : sequence.length === 0
                  ? 'Сначала исходное уравнение.'
                  : sequence.length === 1
                    ? model.rule
                    : 'Последним выбери значение x.',
            )
          }
        >
          <Lightbulb size={18} aria-hidden="true" /> Подсказка
        </button>
        <button type="button" className="button tool-outline" onClick={restart}>
          <RotateCcw size={18} aria-hidden="true" /> Заново
        </button>
      </div>
      <div className="pilot-actions">
        <button type="button" className="button secondary" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" /> К объяснению
        </button>
        {solved &&
          (round < EQUATION_SCENES.length - 1 ? (
            <button type="button" className="button primary" onClick={next}>
              Дальше <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="button primary" onClick={restart}>
              <RotateCcw size={18} aria-hidden="true" /> Ещё раз
            </button>
          ))}
      </div>
    </div>
  );
}

export function EquationPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [variants, setVariants] = useState([0, 0, 0]);
  const [game, setGame] = useState<'match' | 'sequence' | null>(null);
  const [reference, setReference] = useState(false);
  const referenceId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [step, game]);
  const problem = EQUATION_SCENES[step][variants[step]];
  const model = equationModel(problem);
  if (game) return <EquationGame type={game} onExit={() => setGame(null)} />;
  return (
    <div className="equation-pilot year-month-pilot-v2">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {TITLES[step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={<StepIndicator count={3} current={step} label={`Шаг ${step + 1} из 3`} />}
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="Правила уравнений"
            title="Правила уравнений"
            aria-expanded={reference}
            aria-controls={referenceId}
            onClick={() => setReference((value) => !value)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        Выбери другой пример, чтобы увидеть, как целое и части связаны с уравнением. Игры
        открываются отдельно.
      </CardGuide>
      <div id={referenceId} className="pilot-season-reference" hidden={!reference}>
        <p>Слагаемое: сумма минус известная часть.</p>
        <p>Уменьшаемое: разность плюс вычитаемое.</p>
        <p>Вычитаемое: уменьшаемое минус разность.</p>
      </div>
      <div className="equation-line">{model.equation}</div>
      <EquationDiagram problem={problem} reveal />
      <div className="pilot-formula">
        <span>{model.calculation}</span>
        <strong className="pilot-formula-result">= {model.unknown}</strong>
      </div>
      <p className="equation-message" role="status">
        {model.rule}
      </p>
      <div
        className="model-tools equation-model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setVariants((values) => values.map((v, index) => (index === step ? 1 - v : v)))
          }
        >
          <RotateCcw size={18} aria-hidden="true" /> Другой пример
        </button>
      </div>
      <div
        className="model-tools roman-game-entries equation-entries"
        role="group"
        aria-label="Игры"
      >
        <button
          type="button"
          className="button tool-outline"
          aria-label="Найди x — игра «Найди число»"
          onClick={() => setGame('match')}
        >
          <Puzzle size={18} aria-hidden="true" /> Найди x
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Шаги — игра «Собери решение»"
          onClick={() => setGame('sequence')}
        >
          <Puzzle size={18} aria-hidden="true" /> Шаги
        </button>
      </div>
      <div className="pilot-actions">
        {step > 0 && (
          <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} aria-hidden="true" /> Назад
          </button>
        )}
        {step < 2 ? (
          <button type="button" className="button primary" onClick={() => setStep(step + 1)}>
            Дальше <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="button primary" onClick={onPractice}>
            {practiceLabel} <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
