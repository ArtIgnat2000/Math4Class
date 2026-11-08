import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Check, Lightbulb, RotateCcw } from 'lucide-react';
import {
  digitalTime,
  hourProgress,
  pickTime,
  sameTime,
  shiftHours,
  spokenTime,
  type ClockTime,
} from '../engine/clock';
import { CardGuide } from './CardGuide';
import { ClockDial, ClockProgress } from './ClockModel';

const START_HINT = 'Проверь, когда стрелки встанут на место.';

function freshTarget(previous: ClockTime | null): ClockTime {
  const target = pickTime(previous);
  return target;
}

/**
 * «Поставь стрелки» — building the dial from a phrase. The minute hand is placed
 * on the ring (tap, 12 five-minute targets of 44 px), the hour with two buttons.
 * The arcs answer immediately: green is passed, amber is left.
 */
export function ClockSetGame({ onExit }: { onExit: () => void }) {
  const [target, setTarget] = useState(() => freshTarget(null));
  const [guess, setGuess] = useState<ClockTime>(() => shiftHours(target, 2));
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState(START_HINT);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statusId = useId();

  const solved = checked && sameTime(guess, target);
  const { remaining } = hourProgress(target);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const restart = () => {
    const next = freshTarget(target);
    setTarget(next);
    setGuess(shiftHours(next, 2));
    setChecked(false);
    setMessage(START_HINT);
  };

  const check = () => {
    setChecked(true);
    if (sameTime(guess, target)) {
      setMessage(`${digitalTime(target)} — ${spokenTime(target)}. Верно!`);
      return;
    }
    setMessage(`${digitalTime(guess)} — это ${spokenTime(guess)}. Нужно ${spokenTime(target)}.`);
  };

  return (
    <div className="clock-game clock-set-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Поставь стрелки
      </h3>
      <CardGuide kind="Тренажёр">
        Прочитай название времени и поставь стрелки. Проверь себя, когда будешь готов. Игра не
        оценивается.
      </CardGuide>

      <p className="clock-target">
        <span>Поставь</span>
        <strong>{spokenTime(target)}</strong>
      </p>

      <p className="trainer-instruction">Круг ставит минуты, кнопки — час.</p>

      <ClockDial
        time={guess}
        tone="play"
        onMinutePick={(minute) => {
          setChecked(false);
          setGuess((current) => ({ hour: current.hour, minute }));
          setMessage(START_HINT);
        }}
        disabled={solved}
      />
      <ClockProgress time={guess} />

      <div className="clock-hour-picker" role="group" aria-label="Час">
        <button
          type="button"
          className="button tool-outline"
          aria-label="−1 час: предыдущий час"
          onClick={() => {
            setChecked(false);
            setGuess(shiftHours(guess, -1));
          }}
          disabled={solved}
        >
          −1 час
        </button>
        <strong aria-live="polite">{guess.hour} ч</strong>
        <button
          type="button"
          className="button tool-outline"
          aria-label="+1 час: следующий час"
          onClick={() => {
            setChecked(false);
            setGuess(shiftHours(guess, 1));
          }}
          disabled={solved}
        >
          +1 час
        </button>
      </div>

      <p className={`roman-game-message ${solved ? 'is-done' : ''}`} role="status" id={statusId}>
        {message}
      </p>

      <div className="model-tools roman-game-tools" role="group" aria-label="Помощь в игре">
        <button type="button" className="button tool-add" onClick={check} disabled={solved}>
          <Check size={18} aria-hidden="true" /> Проверить
        </button>
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setMessage(
              remaining
                ? `До целого часа не хватает ${remaining} минут.`
                : 'Минутная стрелка стоит на 12.',
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
        {solved && (
          <button type="button" className="button primary" onClick={restart}>
            Ещё время
          </button>
        )}
      </div>
    </div>
  );
}
