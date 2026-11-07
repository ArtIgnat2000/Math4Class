import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import { equalArea, AREA_SIDES } from '../engine/equal-area';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

const TRIANGLES = [
  '50,50 0,0 100,0',
  '50,50 100,0 100,100',
  '50,50 100,100 0,100',
  '50,50 0,100 0,0',
];
const NAMES = ['Верхняя', 'Правая', 'Нижняя', 'Левая'];
function AreaDiagram({
  side,
  parts,
  selected,
}: {
  side: number;
  parts: 2 | 4;
  selected: number[];
}) {
  return (
    <div
      className="area-diagram"
      role="img"
      aria-label={`Квадрат со стороной ${side} см, разделён на ${parts} равных треугольника. Выделено частей: ${selected.length}.`}
    >
      <svg viewBox="-5 -5 110 110" aria-hidden="true" focusable="false">
        {parts === 4 ? (
          TRIANGLES.map((points, i) => (
            <polygon
              key={points}
              points={points}
              className={selected.includes(i) ? 'area-piece selected' : 'area-piece'}
            />
          ))
        ) : (
          <>
            <polygon
              points="0,0 100,0 100,100"
              className={selected.includes(0) ? 'area-piece selected' : 'area-piece'}
            />
            <polygon
              points="0,0 100,100 0,100"
              className={selected.includes(1) ? 'area-piece selected' : 'area-piece'}
            />
          </>
        )}
      </svg>
      <span>Сторона: {side} см</span>
    </div>
  );
}
function AreaGame({ type, onExit }: { type: 'part' | 'half'; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const side = AREA_SIDES[round];
  const model = equalArea(side, 4);
  const reset = () => {
    setRound(0);
    setSelected([]);
    setMessage('');
    setSolved(false);
  };
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="equation-pilot year-game area-game">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {type === 'part' ? 'Найди часть' : 'Собери половину'}
      </h3>
      <CardGuide kind="Тренажёр">
        {type === 'part'
          ? 'Раздели площадь на четыре равные части и выбери площадь одной. Игра не оценивается.'
          : 'Выбери две из четырёх равных частей. Нажми ещё раз, чтобы убрать. Игра не оценивается.'}
      </CardGuide>
      <AreaDiagram side={side} parts={4} selected={type === 'part' ? [0] : selected} />
      {type === 'part' ? (
        <>
          <p className="equation-prompt">Площадь квадрата: {model.whole} см²</p>
          <div
            className="model-tools equation-choices"
            role="group"
            aria-label="Выбери площадь одной части"
          >
            {[model.part - 1, model.part, model.part + 1].map((value) => (
              <button
                type="button"
                className="button tool-outline"
                key={value}
                onClick={() => {
                  setSolved(value === model.part);
                  setMessage(
                    value === model.part
                      ? `${model.whole} : 4 = ${model.part} см².`
                      : 'Раздели всю площадь на четыре равные части.',
                  );
                }}
              >
                {value} см²
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="equation-prompt">Выдели половину квадрата</p>
          <div className="model-tools area-part-buttons" role="group" aria-label="Части квадрата">
            {NAMES.map((name, i) => (
              <button
                type="button"
                className={`button ${selected.includes(i) ? 'tool-add' : 'tool-outline'}`}
                aria-pressed={selected.includes(i)}
                key={name}
                onClick={() => {
                  setSelected((items) =>
                    items.includes(i) ? items.filter((item) => item !== i) : [...items, i],
                  );
                  setSolved(false);
                  setMessage('');
                }}
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              className="button tool-outline"
              onClick={() => {
                setSolved(selected.length === 2);
                setMessage(
                  selected.length === 2
                    ? `2 из 4: ${model.part} + ${model.part} = ${model.part * 2} см².`
                    : 'Половина четырёх равных частей — две части.',
                );
              }}
            >
              Готово
            </button>
          </div>
        </>
      )}
      <p className="equation-message" role="status">
        {message || (type === 'part' ? 'Выбери площадь.' : `Выбрано: ${selected.length} из 4.`)}
      </p>
      <div className="model-tools equation-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setMessage(
              type === 'part'
                ? 'Площадь квадрата раздели на четыре.'
                : 'Половина — две из четырёх равных частей.',
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
          (round === 0 ? (
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setRound(1);
                setSelected([]);
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
export function AreaPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [sideIndex, setSideIndex] = useState(0);
  const [parts, setParts] = useState<2 | 4>(2);
  const [selected, setSelected] = useState(1);
  const [game, setGame] = useState<'part' | 'half' | null>(null);
  const [reference, setReference] = useState(false);
  const referenceId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const modal = heading.current?.closest<HTMLElement>('.modal');
    if (modal) modal.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [step, game]);
  const side = AREA_SIDES[sideIndex];
  const activeParts = step === 0 ? 2 : parts;
  const activeSelected = step === 0 ? 0 : step === 2 ? Math.min(selected, activeParts) : 1;
  const model = equalArea(side, activeParts, activeSelected);
  if (game) return <AreaGame type={game} onExit={() => setGame(null)} />;
  return (
    <div className="equation-pilot year-month-pilot-v2 area-pilot">
      <h3 ref={heading} tabIndex={-1} className="sr-only">
        {['Площадь квадрата', 'Равные части', 'Площадь нескольких частей'][step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={<StepIndicator count={3} current={step} label={`Шаг ${step + 1} из 3`} />}
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="Правила площади"
            title="Правила площади"
            aria-expanded={reference}
            aria-controls={referenceId}
            onClick={() => setReference(!reference)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        Меняй сторону, число равных частей или выделенные части. Площадь измеряют в квадратных
        сантиметрах.
      </CardGuide>
      <div id={referenceId} className="pilot-season-reference" hidden={!reference}>
        <p>Площадь квадрата: сторона умножить на сторону.</p>
        <p>Площадь одной равной части: площадь целого разделить на число частей.</p>
      </div>
      <AreaDiagram
        side={side}
        parts={activeParts}
        selected={Array.from({ length: activeSelected }, (_, i) => i)}
      />
      <div className="pilot-formula">
        <span>
          {step === 0
            ? `${side} × ${side}`
            : step === 1
              ? `${model.whole} : ${activeParts}`
              : `${model.part} × ${activeSelected}`}
        </span>
        <strong className="pilot-formula-result">
          = {step === 0 ? model.whole : step === 1 ? model.part : model.selectedArea} см²
        </strong>
      </div>
      <p className="equation-message" role="status">
        {step === 0
          ? 'Умножь сторону на себя.'
          : step === 1
            ? 'Целое делим на равные части.'
            : 'Площадь одной части умножаем на число частей.'}
      </p>
      <div
        className="model-tools equation-model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        {step === 0 ? (
          <button
            type="button"
            className="button tool-outline"
            onClick={() => setSideIndex(1 - sideIndex)}
          >
            <RotateCcw size={18} aria-hidden="true" /> Другая сторона
          </button>
        ) : step === 1 ? (
          <button
            type="button"
            className="button tool-outline"
            onClick={() => {
              setParts(parts === 2 ? 4 : 2);
              setSelected(1);
            }}
          >
            Частей: {parts === 2 ? '4' : '2'}
          </button>
        ) : (
          <button
            type="button"
            className="button tool-outline"
            onClick={() => setSelected((selected % parts) + 1)}
          >
            Частей: {(selected % parts) + 1}
          </button>
        )}
      </div>
      <div
        className="model-tools roman-game-entries equation-entries"
        role="group"
        aria-label="Игры"
      >
        <button
          type="button"
          className="button tool-outline"
          aria-label="Площадь — игра «Найди часть»"
          onClick={() => setGame('part')}
        >
          <Puzzle size={18} aria-hidden="true" /> Площадь
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Половина — игра «Собери половину»"
          onClick={() => setGame('half')}
        >
          <Puzzle size={18} aria-hidden="true" /> Половина
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
