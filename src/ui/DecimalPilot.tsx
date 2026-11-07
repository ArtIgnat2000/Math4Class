import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import {
  DECIMAL_SCENES,
  decimalModel,
  formatDecimal,
  PLACE_NAMES,
  type DecimalKind,
  type DecimalScene,
} from '../engine/decimal-lessons';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

const SHORT_NAMES = ['10 тыс.', '1 тыс.', '100', '10', '1'];
function Places({ scene, showResult }: { scene: DecimalScene; showResult: boolean }) {
  const model = decimalModel(scene);
  const describe = (digits: number[]) =>
    PLACE_NAMES.map((name, i) => `${name}: ${digits[i]}`).join(', ');
  return (
    <div
      className="decimal-places"
      role="img"
      aria-label={`До действия: ${formatDecimal(scene.left)}, ${describe(model.input)}. ${showResult ? `После действия: ${formatDecimal(model.result)}, ${describe(model.output)}.` : ''}`}
    >
      <div className="decimal-grid" aria-hidden="true">
        {SHORT_NAMES.map((name) => (
          <span className="decimal-place-name" key={name}>
            {name}
          </span>
        ))}
        {model.input.map((digit, i) => (
          <strong key={`a${i}`}>{digit}</strong>
        ))}
        {showResult &&
          model.output.map((digit, i) => (
            <strong className="decimal-output" key={`b${i}`}>
              {digit}
            </strong>
          ))}
      </div>
      <div className="decimal-legend" aria-hidden="true">
        {showResult ? 'Сверху — до, снизу — после.' : 'Разряды исходного числа.'}
      </div>
    </div>
  );
}
function DecimalGame({
  kind,
  type,
  onExit,
}: {
  kind: DecimalKind;
  type: 'match' | 'digits';
  onExit: () => void;
}) {
  const [round, setRound] = useState(0);
  const [digits, setDigits] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const scene = DECIMAL_SCENES[kind][round][0];
  const model = decimalModel(scene);
  const names = PLACE_NAMES.slice(5 - model.digits.length);
  const next = model.digits[digits.length];
  const reset = () => {
    setRound(0);
    setDigits([]);
    setMessage('');
    setSolved(false);
  };
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="equation-pilot year-game decimal-game">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {type === 'match' ? 'Найди результат' : 'Собери число'}
      </h3>
      <CardGuide kind="Тренажёр">
        {type === 'match'
          ? 'Посмотри на число и действие. Выбери результат. Игра не оценивается.'
          : 'По записи разрядов выбери цифры числа слева направо. Игра не оценивается.'}
      </CardGuide>
      {type === 'match' ? (
        <>
          <Places scene={scene} showResult={false} />
          <p className="equation-prompt">
            {formatDecimal(scene.left)} {scene.operation} {formatDecimal(scene.right)} = ?
          </p>
          <div className="model-tools equation-choices" role="group" aria-label="Выбери результат">
            {[model.result - 1, model.result, model.result + 1].map((value) => (
              <button
                type="button"
                className="button tool-outline"
                key={value}
                onClick={() => {
                  setSolved(value === model.result);
                  setMessage(
                    value === model.result
                      ? `${formatDecimal(scene.left)} ${scene.operation} ${formatDecimal(scene.right)} = ${formatDecimal(model.result)}.`
                      : kind === 'powers'
                        ? 'Проверь, на сколько разрядов переместились цифры.'
                        : 'Вычисли действие в нужном разряде.',
                  );
                }}
              >
                {formatDecimal(value)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="decimal-decomposition" aria-label="Разряды числа">
            {model.digits.map((digit, i) => (
              <span key={names[i]}>
                {names[i]}: <strong>{digit}</strong>
              </span>
            ))}
          </div>
          <p className="equation-prompt">
            {digits.length < model.digits.length
              ? `Выбери: ${names[digits.length]}`
              : 'Число собрано'}
          </p>
          <div
            className="decimal-assembled"
            aria-label={`Собрано цифр: ${digits.length} из ${model.digits.length}`}
          >
            {model.digits.map((_, i) => (
              <span key={i}>{digits[i] ?? '□'}</span>
            ))}
          </div>
          {digits.length < model.digits.length && (
            <div className="model-tools equation-choices" role="group" aria-label="Выбери цифру">
              {[(next + 1) % 10, next, (next + 2) % 10].map((value) => (
                <button
                  type="button"
                  className="button tool-outline"
                  key={value}
                  onClick={() => {
                    if (value !== next) {
                      setMessage(`Посмотри на разряд «${names[digits.length]}».`);
                      return;
                    }
                    const after = [...digits, value];
                    setDigits(after);
                    setSolved(after.length === model.digits.length);
                    setMessage(
                      after.length === model.digits.length
                        ? `Получилось ${formatDecimal(model.result)}.`
                        : 'Цифра стоит на своём месте.',
                    );
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <p className="equation-message" role="status">
        {message || (type === 'match' ? 'Выбери число.' : 'Начни с разряда слева.')}
      </p>
      <div className="model-tools equation-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setMessage(
              type === 'digits'
                ? 'Читай разряды слева направо; ноль тоже занимает место.'
                : kind === 'powers'
                  ? 'При умножении цифры переходят в старшие разряды, при делении — в младшие.'
                  : 'Сравни изменившийся разряд с исходным числом.',
            )
          }
        >
          <Lightbulb size={18} aria-hidden="true" /> Подсказка
        </button>
        <button type="button" className="button tool-outline" onClick={reset}>
          <RotateCcw size={18} aria-hidden="true" /> Заново
        </button>
      </div>
      <div className="pilot-actions">
        <button type="button" className="button secondary" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" /> К объяснению
        </button>
        {solved &&
          (round < 2 ? (
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setRound(round + 1);
                setDigits([]);
                setMessage('');
                setSolved(false);
              }}
            >
              Дальше <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="button primary" onClick={reset}>
              <RotateCcw size={18} aria-hidden="true" /> Ещё раз
            </button>
          ))}
      </div>
    </div>
  );
}
export function DecimalPilot({
  kind,
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  kind: DecimalKind;
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [variants, setVariants] = useState([0, 0, 0]);
  const [game, setGame] = useState<'match' | 'digits' | null>(null);
  const [reference, setReference] = useState(false);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [step, game]);
  const scene = DECIMAL_SCENES[kind][step][variants[step]];
  const model = decimalModel(scene);
  const titles =
    kind === 'powers'
      ? ['Умножаем на 10', 'Умножаем на 100 и 1 000', 'Делим круглое число']
      : ['Складываем по разрядам', 'Вычитаем сотни', 'Вычитаем десятки'];
  if (game) return <DecimalGame kind={kind} type={game} onExit={() => setGame(null)} />;
  return (
    <div className="equation-pilot year-month-pilot-v2 decimal-pilot">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {titles[step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={<StepIndicator count={3} current={step} label={`Шаг ${step + 1} из 3`} />}
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="Правила разрядов"
            title="Правила разрядов"
            aria-expanded={reference}
            aria-controls={id}
            onClick={() => setReference(!reference)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        Выбери другой пример и сравни разряды до и после действия. Игры открываются отдельно.
      </CardGuide>
      <div id={id} className="pilot-season-reference" hidden={!reference}>
        {kind === 'powers' ? (
          <>
            <p>
              При умножении на 10, 100 или 1 000 цифры переходят на один, два или три разряда влево.
            </p>
            <p>При делении подходящего круглого числа цифры переходят вправо.</p>
          </>
        ) : (
          <>
            <p>Складывай и вычитай единицы одного разряда.</p>
            <p>Ноль сохраняет место пустого разряда.</p>
          </>
        )}
      </div>
      <Places scene={scene} showResult />
      <div className="pilot-formula">
        <span>
          {formatDecimal(scene.left)} {scene.operation} {formatDecimal(scene.right)}
        </span>
        <strong className="pilot-formula-result">= {formatDecimal(model.result)}</strong>
      </div>
      <p className="equation-message" role="status">
        {kind === 'powers'
          ? scene.operation === '×'
            ? 'Цифры сдвигаются влево.'
            : 'Цифры сдвигаются вправо.'
          : ['Складываем по разрядам.', 'Меняются только сотни.', 'Ноль на месте десятков.'][step]}
      </p>
      <div
        className="model-tools equation-model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        <button
          type="button"
          className="button tool-outline"
          onClick={() => setVariants((values) => values.map((v, i) => (i === step ? 1 - v : v)))}
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
          aria-label="Результат — игра «Найди результат»"
          onClick={() => setGame('match')}
        >
          <Puzzle size={18} aria-hidden="true" /> Результат
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Число — игра «Собери число»"
          onClick={() => setGame('digits')}
        >
          <Puzzle size={18} aria-hidden="true" /> Число
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
