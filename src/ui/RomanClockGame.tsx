import { CardGuide } from './CardGuide';
import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react';
import { CLOCK_NUMBERS, shuffledTargets, toRoman } from '../engine/roman';
import { RomanDial, dialLabelPoint } from './RomanModel';

const START_HINT = 'Проведи пальцем по кругу или нажми сектор.';

/** Sector under a point of the dial; the middle hole shows the task and is not a target. */
export function dialSectorAtPoint(x: number, y: number, rect: DOMRect | null): number | null {
  if (!rect) return null;
  const radius = rect.width / 2;
  if (radius <= 0) return null;
  const dx = x - (rect.left + radius);
  const dy = y - (rect.top + rect.height / 2);
  const distance = Math.hypot(dx, dy);
  if (distance > radius * 1.02 || distance < radius * 0.32) return null;
  const fromTop = ((((Math.atan2(dy, dx) * 180) / Math.PI + 90) % 360) + 360) % 360;
  return Math.floor(fromTop / 30) % 12;
}

/**
 * «Римские часы» — the wheel mechanic the owner liked, now with roman numerals.
 * An author's training game: no points, no timer, no storage, no checked session.
 */
export function RomanClockGame({ onExit }: { onExit: () => void }) {
  const [order, setOrder] = useState<number[]>(() => shuffledTargets());
  const [done, setDone] = useState<number[]>([]);
  const [aim, setAim] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [miss, setMiss] = useState<number | null>(null);
  const [message, setMessage] = useState(START_HINT);
  const dialRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dragging = useRef(false);
  const missTimer = useRef<number | undefined>(undefined);
  const statusId = useId();

  const target = order[0] ?? null;
  const finished = target === null;

  useEffect(() => {
    headingRef.current?.focus();
    return () => window.clearTimeout(missTimer.current);
  }, []);

  const attempt = (index: number) => {
    if (finished || target === null) return;
    const chosen = CLOCK_NUMBERS[index].value;
    setAim(index);
    if (chosen === target) {
      setDone((prev) => [...prev, index]);
      setOrder((prev) => prev.slice(1));
      setHint(false);
      setMiss(null);
      setMessage(
        order.length === 1 ? 'Часы собраны!' : `${toRoman(chosen)} — это ${chosen}. Верно!`,
      );
      return;
    }
    setMiss(index);
    setMessage(`${toRoman(chosen)} — это ${chosen}. Нужно ${target}.`);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(null), 900);
  };

  const restart = () => {
    setOrder(shuffledTargets());
    setDone([]);
    setAim(null);
    setHint(false);
    setMiss(null);
    setMessage(START_HINT);
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const index = dialSectorAtPoint(
      event.clientX,
      event.clientY,
      dialRef.current?.getBoundingClientRect() ?? null,
    );
    if (index !== null) setAim(index);
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    const index = dialSectorAtPoint(
      event.clientX,
      event.clientY,
      dialRef.current?.getBoundingClientRect() ?? null,
    );
    if (index !== null) attempt(index);
  };

  return (
    <div className="roman-game roman-clock-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Римские часы
      </h3>
      <CardGuide kind="Тренажёр">
        Найди на круге римскую запись числа в центре. Проведи пальцем к сектору или нажми его. Игра
        не оценивается.
      </CardGuide>
      <p className="trainer-instruction">Найди на круге римскую запись числа в центре.</p>
      <div className="roman-game-layout">
        <div
          className="roman-dial"
          ref={dialRef}
          role="group"
          aria-label="Римский циферблат: двенадцать секторов"
          aria-describedby={statusId}
          onPointerDown={(event) => {
            if (finished) return;
            dragging.current = true;
            event.currentTarget.setPointerCapture?.(event.pointerId);
            move(event);
          }}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          <RomanDial
            filledIndices={done}
            aim={aim}
            hintIndex={hint && target !== null ? target - 1 : null}
            missIndex={miss}
            label={`Циферблат. Найдено ${done.length} из 12 чисел.`}
          />
          <div className="roman-dial-center" aria-hidden="true">
            {finished ? (
              <>
                <strong>12</strong>
                <span>из 12</span>
              </>
            ) : (
              <>
                <strong>{target}</strong>
                <span>найди</span>
              </>
            )}
          </div>
          <div className="roman-dial-targets">
            {CLOCK_NUMBERS.map((item, index) => {
              const point = dialLabelPoint(index);
              return (
                <button
                  type="button"
                  key={item.record}
                  className="roman-dial-hit"
                  data-roman-sector={index}
                  style={{ left: `${(point.x / 280) * 100}%`, top: `${(point.y / 280) * 100}%` }}
                  disabled={finished || done.includes(index)}
                  aria-label={`Сектор ${item.record}`}
                  onClick={() => attempt(index)}
                />
              );
            })}
          </div>
        </div>

        <div className="model-tools roman-game-tools" role="group" aria-label="Помощь в игре">
          <button
            type="button"
            className="button tool-outline"
            onClick={() => {
              setHint(true);
              if (target !== null) setMessage(`Ищи ${toRoman(target)} — подсвечен.`);
            }}
            disabled={finished}
          >
            <Lightbulb size={18} aria-hidden="true" /> Подсказка
          </button>
          <button type="button" className="button tool-outline" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" /> Заново
          </button>
        </div>
      </div>

      <p className={`roman-game-message ${finished ? 'is-done' : ''}`} role="status" id={statusId}>
        {message}
      </p>

      <div className="pilot-actions">
        <button type="button" className="button secondary" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" /> К объяснению
        </button>
        {finished && (
          <button type="button" className="button primary" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" /> Ещё раз
          </button>
        )}
      </div>
    </div>
  );
}
