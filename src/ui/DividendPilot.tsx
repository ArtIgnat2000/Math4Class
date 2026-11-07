import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import { dividendModel, DIVIDEND_SCENES, type DividendScene } from '../engine/dividend-model';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

function Groups({ scene, revealTotal = true }: { scene: DividendScene; revealTotal?: boolean }) {
  const { groups, dividend } = dividendModel(scene);
  return (
    <div
      className="dividend-model"
      role="img"
      aria-label={`${scene.quotient} группы по ${scene.divisor}, всего ${groups}; остаток ${scene.remainder}${revealTotal ? `; всего ${dividend}` : ''}.`}
    >
      <div className="dividend-groups" aria-hidden="true">
        {Array.from({ length: scene.quotient }, (_, i) => (
          <span key={i}>{'● '.repeat(scene.divisor).trim()}</span>
        ))}
        <span className="dividend-remainder">
          {scene.remainder ? '● '.repeat(scene.remainder).trim() : '—'}
        </span>
      </div>
      <div className="dividend-labels">
        <span>
          {scene.quotient} группы по {scene.divisor}
        </span>
        <span>Остаток: {scene.remainder}</span>
      </div>
    </div>
  );
}

function DividendGame({ type, onExit }: { type: 'match' | 'build'; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const [remainder, setRemainder] = useState(0);
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const scene = DIVIDEND_SCENES[round];
  const model = dividendModel(scene);
  const restart = () => {
    setRound(0);
    setRemainder(0);
    setMessage('');
    setSolved(false);
  };
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="equation-pilot year-game dividend-game">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {type === 'match' ? 'Найди делимое' : 'Собери остаток'}
      </h3>
      <CardGuide kind="Тренажёр">
        {type === 'match'
          ? 'Посмотри на группы и остаток. Выбери всё число. Игра не оценивается.'
          : 'Добавь остаток к группам. Остаток меньше делителя. Игра не оценивается.'}
      </CardGuide>
      {type === 'match' ? (
        <>
          <Groups scene={scene} revealTotal={solved} />
          <p className="equation-prompt">Сколько всего?</p>
          <div className="model-tools equation-choices" role="group" aria-label="Выбери делимое">
            {[model.dividend - 1, model.dividend, model.dividend + 1].map((value) => (
              <button
                type="button"
                className="button tool-outline"
                key={value}
                onClick={() => {
                  setSolved(value === model.dividend);
                  setMessage(
                    value === model.dividend
                      ? `${scene.divisor} × ${scene.quotient} + ${scene.remainder} = ${model.dividend}.`
                      : 'Сложи число в группах и остаток.',
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
          <p className="equation-prompt">Собери остаток {scene.remainder}</p>
          <Groups scene={{ ...scene, remainder }} />
          <div
            className="model-tools equation-choices"
            role="group"
            aria-label="Управление остатком"
          >
            <button
              type="button"
              className="button tool-outline"
              onClick={() => {
                if (remainder === 0) {
                  setMessage('В остатке пока нет предметов.');
                  return;
                }
                setRemainder(remainder - 1);
                setSolved(false);
                setMessage('Убрали один предмет.');
              }}
            >
              − 1
            </button>
            <button
              type="button"
              className="button tool-outline"
              onClick={() => {
                if (remainder + 1 >= scene.divisor) {
                  setMessage('Остаток должен быть меньше делителя.');
                  return;
                }
                setRemainder(remainder + 1);
                setSolved(false);
                setMessage('Добавили один предмет.');
              }}
            >
              + 1
            </button>
            <button
              type="button"
              className="button tool-outline"
              onClick={() => {
                setSolved(remainder === scene.remainder);
                setMessage(
                  remainder === scene.remainder
                    ? `${model.groups} + ${remainder} = ${model.dividend}.`
                    : 'Сравни остаток с числом в задании.',
                );
              }}
            >
              Готово
            </button>
          </div>
        </>
      )}
      <p className="equation-message" role="status">
        {message || (type === 'match' ? 'Нажми число.' : 'Добавляй по одному.')}
      </p>
      <div className="model-tools equation-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setMessage(
              type === 'match'
                ? 'Умножь делитель на частное и прибавь остаток.'
                : 'Остаток меньше делителя и не входит в группы.',
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
          (round < DIVIDEND_SCENES.length - 1 ? (
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setRound(round + 1);
                setRemainder(0);
                setMessage('');
                setSolved(false);
              }}
            >
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

export function DividendPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [variants, setVariants] = useState([0, 0, 0]);
  const [game, setGame] = useState<'match' | 'build' | null>(null);
  const [reference, setReference] = useState(false);
  const referenceId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [step, game]);
  const scene = DIVIDEND_SCENES[(step + variants[step]) % DIVIDEND_SCENES.length];
  const model = dividendModel(scene);
  if (game) return <DividendGame type={game} onExit={() => setGame(null)} />;
  return (
    <div className="equation-pilot year-month-pilot-v2 dividend-pilot">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {['Равные группы', 'Остаток', 'Находим делимое'][step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={<StepIndicator count={3} current={step} label={`Шаг ${step + 1} из 3`} />}
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="Правило деления с остатком"
            title="Правило деления с остатком"
            aria-expanded={reference}
            aria-controls={referenceId}
            onClick={() => setReference(!reference)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        Выбери другой пример и посмотри, как меняются группы и остаток. Игры открываются отдельно.
      </CardGuide>
      <div id={referenceId} className="pilot-season-reference" hidden={!reference}>
        <p>Делимое равно произведению делителя и неполного частного плюс остаток.</p>
        <p>Остаток меньше делителя.</p>
      </div>
      <Groups scene={scene} />
      <div className="pilot-formula">
        <span>
          {scene.divisor} × {scene.quotient} + {scene.remainder}
        </span>
        <strong className="pilot-formula-result">= {model.dividend}</strong>
      </div>
      <p className="equation-message" role="status">
        {
          [
            `${scene.quotient} группы по ${scene.divisor}: всего ${model.groups}.`,
            `Остаток ${scene.remainder} меньше делителя ${scene.divisor}.`,
            `К ${model.groups} прибавь ${scene.remainder}: получим ${model.dividend}.`,
          ][step]
        }
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
            setVariants((values) => values.map((v, i) => (i === step ? (v + 1) % 3 : v)))
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
          aria-label="Найди число — игра «Найди делимое»"
          onClick={() => setGame('match')}
        >
          <Puzzle size={18} aria-hidden="true" /> Найди число
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Остаток — игра «Собери остаток»"
          onClick={() => setGame('build')}
        >
          <Puzzle size={18} aria-hidden="true" /> Остаток
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
