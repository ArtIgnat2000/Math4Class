import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react';
import { CALENDAR_MONTHS as MONTHS, SeasonIcon, YearRing } from './CalendarModel';

/** Fisher-Yates; never deals an already solved board. Exported for deterministic tests. */
export function shuffledMonths(random: () => number = Math.random): number[] {
  const order = MONTHS.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((value, index) => value === index)) order.reverse();
  return order;
}

/** Nearest ancestor that actually scrolls — the explanation dialog on phones. */
function scrollParentOf(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight)
      return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Resolve a drop forgivingly: the numbered button first, then the sector under
 * the finger, so a child does not have to hit a 44px circle exactly. Points in
 * the middle hole or outside the circle are not a place for a month.
 */
function slotAtPoint(x: number, y: number): number | null {
  const target = document.elementFromPoint(x, y)?.closest('[data-year-slot]');
  if (target) {
    const value = Number((target as HTMLElement).dataset.yearSlot);
    if (Number.isInteger(value) && value >= 0 && value < 12) return value;
  }
  const ring = document.querySelector('.year-game-clock');
  if (!ring) return null;
  const rect = ring.getBoundingClientRect();
  const radius = rect.width / 2;
  if (radius <= 0) return null;
  const dx = x - (rect.left + radius);
  const dy = y - (rect.top + rect.height / 2);
  const distance = Math.hypot(dx, dy);
  if (distance > radius * 1.02 || distance < radius * 0.3) return null;
  const fromTop = ((((Math.atan2(dy, dx) * 180) / Math.PI + 90) % 360) + 360) % 360;
  return Math.floor(fromTop / 30) % 12;
}

const START_HINT = 'Можно нажать: месяц → место.';

/**
 * «Собери год» — an author's learning game inside the explanation, not a textbook
 * exercise. It never awards points, never writes progress and never starts the
 * checked session; the child only practises the order of the twelve months.
 */
export function YearBuildGame({ onExit }: { onExit: () => void }) {
  const [placed, setPlaced] = useState<(number | null)[]>(() => Array(12).fill(null));
  const [tray, setTray] = useState<number[]>(() => shuffledMonths());
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ month: number; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [miss, setMiss] = useState<number | null>(null);
  const [message, setMessage] = useState(START_HINT);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const missTimer = useRef<number | undefined>(undefined);
  const dragState = useRef<{
    month: number;
    startX: number;
    startY: number;
    active: boolean;
    pointerId: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const scroller = useRef<HTMLElement | null>(null);
  const lastPoint = useRef({ x: 0, y: 0 });
  const scrollFrame = useRef<number | undefined>(undefined);
  const statusId = useId();

  const done = tray.length === 0;
  const collected = 12 - tray.length;

  useEffect(() => {
    headingRef.current?.focus();
    return () => {
      window.clearTimeout(missTimer.current);
      if (scrollFrame.current !== undefined) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);

  useEffect(() => {
    if (done) setMessage('Год собран!');
  }, [done]);

  const attempt = (month: number, slot: number) => {
    if (placed[slot] !== null) {
      setMessage(`Место ${slot + 1} занято.`);
      return;
    }
    if (month === slot) {
      setPlaced((prev) => {
        const next = [...prev];
        next[slot] = month;
        return next;
      });
      setTray((prev) => prev.filter((item) => item !== month));
      setSelected(null);
      setHint(null);
      setMessage(`${MONTHS[month].full} — ${month + 1}-й. Верно!`);
      return;
    }
    setMiss(slot);
    setMessage(`${MONTHS[month].full} — не ${slot + 1}-й месяц. Попробуй ещё.`);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(null), 450);
  };

  const restart = () => {
    window.clearTimeout(missTimer.current);
    stopAutoScroll();
    dragState.current = null;
    setPlaced(Array(12).fill(null));
    setTray(shuffledMonths());
    setSelected(null);
    setHint(null);
    setMiss(null);
    setDrag(null);
    setHover(null);
    setMessage(START_HINT);
  };

  const showHint = () => {
    const month = selected ?? tray[0];
    if (month === undefined) return;
    setHint(month);
    setMessage(`${MONTHS[month].full} — ${month + 1}-й. Место подсвечено.`);
  };

  /**
   * On a small phone the box of months sits below the circle, so a finger has to
   * be able to drag past the edge of the dialog: scroll while it waits there.
   */
  const stopAutoScroll = () => {
    if (scrollFrame.current !== undefined) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = undefined;
  };

  const runAutoScroll = () => {
    if (scrollFrame.current !== undefined) return;
    const step = () => {
      scrollFrame.current = undefined;
      if (!dragState.current?.active) return;
      const area = scroller.current;
      if (area) {
        const rect = area.getBoundingClientRect();
        const edge = 56;
        const { x, y } = lastPoint.current;
        const up = Math.max(0, rect.top + edge - y);
        const down = Math.max(0, y - (rect.bottom - edge));
        const speed = up > 0 ? -Math.min(14, up / 3) : down > 0 ? Math.min(14, down / 3) : 0;
        if (speed !== 0) {
          const before = area.scrollTop;
          area.scrollTop += speed;
          if (area.scrollTop !== before) {
            const over = slotAtPoint(x, y);
            setHover((prev) => (prev === over ? prev : over));
          }
        }
      }
      scrollFrame.current = requestAnimationFrame(step);
    };
    scrollFrame.current = requestAnimationFrame(step);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, month: number) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragState.current = {
      month,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      pointerId: event.pointerId,
    };
    scroller.current = scrollParentOf(event.currentTarget);
    lastPoint.current = { x: event.clientX, y: event.clientY };
    // Without capture the drag cannot follow the finger; tapping still works.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    if (!state.active && distance < 6) return;
    state.active = true;
    setDrag({ month: state.month, x: event.clientX, y: event.clientY });
    setHover(slotAtPoint(event.clientX, event.clientY));
    runAutoScroll();
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    dragState.current = null;
    stopAutoScroll();
    if (!state?.active) return;
    suppressClick.current = true;
    const slot = slotAtPoint(event.clientX, event.clientY);
    setDrag(null);
    setHover(null);
    if (slot !== null) attempt(state.month, slot);
    else setMessage('Месяц возвращён.');
  };

  const cancelDrag = () => {
    dragState.current = null;
    stopAutoScroll();
    setDrag(null);
    setHover(null);
  };

  return (
    <div className="year-game">
      <h3 ref={headingRef} tabIndex={-1}>
        Собери год
      </h3>
      <p className="year-game-lead">Перетащи месяцы по порядку.</p>

      <div className="year-game-layout">
        <div
          className="year-clock year-game-clock"
          role="group"
          aria-label="Круг года: места для месяцев"
        >
          <YearRing
            filled={0}
            filledIndices={placed.flatMap((value, index) => (value === null ? [] : [index]))}
            label={`Круг года. Собрано ${collected} из 12 месяцев.`}
          />
          <div className="year-clock-center" aria-hidden="true">
            <strong>{collected}</strong>
            <span>из 12</span>
          </div>
          {MONTHS.map((item, index) => {
            const angle = ((index * 30 - 75) * Math.PI) / 180;
            const value = placed[index];
            const filled = value !== null;
            return (
              <button
                key={item.full}
                type="button"
                data-year-slot={index}
                className={[
                  'year-clock-month',
                  'year-game-slot',
                  filled ? `season-${item.season} is-filled` : '',
                  hover === index ? 'is-hover' : '',
                  hint === index ? 'is-hint' : '',
                  miss === index ? 'is-miss' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${50 + 35.5 * Math.cos(angle)}%`,
                  top: `${50 + 35.5 * Math.sin(angle)}%`,
                }}
                aria-label={
                  filled ? `Место ${index + 1}: ${item.full}` : `Место ${index + 1}, пусто`
                }
                onClick={() => {
                  if (selected !== null) attempt(selected, index);
                  else if (!filled) setMessage('Выбери месяц.');
                }}
              >
                {filled ? item.short : index + 1}
              </button>
            );
          })}
        </div>

        <div className="year-game-side">
          <p className="year-game-tray-title" id={statusId}>
            {done ? 'Готово' : 'Месяцы'}
          </p>
          <div className="year-game-tray" role="group" aria-label="Коробка с месяцами">
            {tray.map((month) => {
              const item = MONTHS[month];
              return (
                <button
                  key={item.full}
                  type="button"
                  className={`year-game-chip season-${item.season} ${
                    selected === month ? 'is-selected' : ''
                  } ${drag?.month === month ? 'is-dragging' : ''}`}
                  aria-pressed={selected === month}
                  aria-label={item.full}
                  onPointerDown={(event) => onPointerDown(event, month)}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={cancelDrag}
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    setSelected((prev) => (prev === month ? null : month));
                    setHint(null);
                    setMessage(`${item.full}: нажми место.`);
                  }}
                >
                  <SeasonIcon season={item.season} size={15} />
                  {item.full}
                </button>
              );
            })}
          </div>

          <div className="year-game-tools model-tools" role="group" aria-label="Помощь в игре">
            <button
              type="button"
              className="button tool-outline"
              onClick={showHint}
              disabled={done}
            >
              <Lightbulb size={18} aria-hidden="true" /> Подсказка
            </button>
            <button type="button" className="button tool-outline" onClick={restart}>
              <RotateCcw size={18} aria-hidden="true" /> Заново
            </button>
          </div>
        </div>
      </div>

      <p className={`year-game-message ${done ? 'is-done' : ''}`} role="status">
        {message}
      </p>

      <div className="pilot-actions">
        <button type="button" className="button secondary" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" /> К объяснению
        </button>
        {done && (
          <button type="button" className="button primary" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" /> Ещё раз
          </button>
        )}
      </div>

      {drag && (
        <span
          className={`year-game-ghost season-${MONTHS[drag.month].season}`}
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <SeasonIcon season={MONTHS[drag.month].season} size={15} />
          {MONTHS[drag.month].full}
        </span>
      )}
    </div>
  );
}
