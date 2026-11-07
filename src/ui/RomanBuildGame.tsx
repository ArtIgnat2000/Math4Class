import { CardGuide } from './CardGuide';
import { Fragment, useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Delete, Lightbulb, RotateCcw } from 'lucide-react';
import {
  BUILD_TARGETS,
  ROMAN_SIGNS,
  romanIssue,
  romanValue,
  toRoman,
  type RomanSign,
} from '../engine/roman';
import {
  dropIndexAt,
  insertSign,
  insideBoard,
  moveSign,
  removeSign,
  type RomanBoard,
} from '../engine/roman-board';
import { RomanTile, signTone } from './RomanModel';

const START_HINT = 'Перетащи знак в запись или нажми его.';

type DragState = {
  sign: RomanSign;
  /** Index on the board, or null when the sign comes from the tray. */
  from: number | null;
  startX: number;
  startY: number;
  active: boolean;
  pointerId: number;
};

/**
 * «Собери число» — a constructor the child really drags: a sign goes from the
 * tray to any place in the record, placed signs are reordered by hand, and a
 * sign is taken back out by dragging it off the board. Tap and keyboard give
 * the same three actions (PLAY-01). No points, no storage, no checked session.
 */
export function RomanBuildGame({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [board, setBoard] = useState<RomanSign[]>([]);
  const [message, setMessage] = useState(START_HINT);
  const [hint, setHint] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ sign: RomanSign; x: number; y: number } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const statusId = useId();

  const target = BUILD_TARGETS[step] ?? null;
  const finished = target === null;
  const record = board.join('');
  const value = record ? romanValue(record) : null;
  const solved = !finished && value === target && romanIssue(record) === null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (finished) setMessage('Все числа собраны!');
  }, [finished]);

  // After a keyboard move the tile is re-keyed, so focus is restored to it.
  useEffect(() => {
    if (focusIndex === null) return;
    dropRef.current?.querySelector<HTMLElement>(`[data-build-index="${focusIndex}"]`)?.focus();
    setFocusIndex(null);
  }, [focusIndex, board]);

  /** One place where every edit — drag, tap or key — reports what happened. */
  const apply = (next: RomanBoard, takenOut?: RomanSign, select: number | null = null) => {
    if (next.refusal) {
      setMessage(next.refusal);
      return;
    }
    setBoard(next.signs);
    setSelected(select);
    setHint(false);
    const text = next.signs.join('');
    if (!text) {
      setMessage(START_HINT);
      return;
    }
    if (next.value === target) {
      setMessage(`${text} — это ${next.value}. Верно!`);
      return;
    }
    setMessage(
      takenOut ? `Знак ${takenOut} убран.` : `${text} — это ${next.value}. Нужно ${target}.`,
    );
  };

  const tileBoxes = () =>
    Array.from(dropRef.current?.querySelectorAll<HTMLElement>('[data-build-index]') ?? []).map(
      (node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, width: box.width };
      },
    );

  const beginDrag = (
    event: PointerEvent<HTMLButtonElement>,
    sign: RomanSign,
    from: number | null,
  ) => {
    if (finished) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // A new gesture always starts clean, even if the previous drag ended on a
    // button that became disabled and never received its click.
    suppressClick.current = false;
    dragState.current = {
      sign,
      from,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      pointerId: event.pointerId,
    };
    // Without capture the sign cannot follow the finger; a tap still works.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    if (!state.active && distance < 6) return;
    state.active = true;
    setDrag({ sign: state.sign, x: event.clientX, y: event.clientY });
    const rect = dropRef.current?.getBoundingClientRect() ?? null;
    setDropIndex(
      insideBoard(event.clientX, event.clientY, rect)
        ? dropIndexAt(event.clientX, tileBoxes())
        : null,
    );
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    dragState.current = null;
    if (!state?.active) return;
    suppressClick.current = true;
    setDrag(null);
    setDropIndex(null);
    const rect = dropRef.current?.getBoundingClientRect() ?? null;
    const inside = insideBoard(event.clientX, event.clientY, rect);
    if (inside) {
      const at = dropIndexAt(event.clientX, tileBoxes());
      if (state.from === null) {
        apply(insertSign(board, state.sign, at));
      } else {
        // The gap is counted with the dragged tile still on the board.
        apply(moveSign(board, state.from, at > state.from ? at - 1 : at));
      }
      return;
    }
    // Dragged off the board: a placed sign goes back to the tray, a new one is cancelled.
    if (state.from !== null) apply(removeSign(board, state.from), state.sign);
    else setMessage(START_HINT);
  };

  const cancelDrag = () => {
    dragState.current = null;
    setDrag(null);
    setDropIndex(null);
  };

  const next = () => {
    setStep((prev) => prev + 1);
    setBoard([]);
    setSelected(null);
    setHint(false);
    setMessage(START_HINT);
  };

  const restart = () => {
    setStep(0);
    setBoard([]);
    setSelected(null);
    setHint(false);
    setMessage(START_HINT);
  };

  /** Move a placed sign and keep it selected, so it can be moved again. */
  const shift = (index: number, to: number, followWithFocus = false) => {
    const result = moveSign(board, index, to);
    const at = Math.max(0, Math.min(to, board.length - 1));
    apply(result, undefined, result.refusal ? index : at);
    if (!result.refusal && followWithFocus) setFocusIndex(at);
  };

  return (
    <div className="roman-game roman-build-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Собери число
      </h3>
      <CardGuide kind="Тренажёр">
        Собери указанное число: перетащи знаки на табло или нажимай их. Знаки можно переставлять и
        убирать. Игра не оценивается.
      </CardGuide>

      <div className="roman-build-target" aria-live="polite">
        {finished ? (
          <strong className="roman-build-done">Готово!</strong>
        ) : (
          <>
            <span className="roman-build-caption">Запиши римскими цифрами</span>
            <strong>{target}</strong>
            {hint && <span className="roman-build-hint">{toRoman(target)}</span>}
          </>
        )}
      </div>

      <div
        ref={dropRef}
        className={`roman-build-drop ${dropIndex !== null ? 'is-over' : ''} ${
          solved ? 'is-solved' : ''
        }`}
        role="group"
        aria-label="Запись числа"
        aria-describedby={statusId}
      >
        <div className="roman-build-slots">
          {board.map((sign, index) => (
            <Fragment key={`${sign}${index}`}>
              {dropIndex === index && <span className="roman-build-caret" aria-hidden="true" />}
              <button
                type="button"
                data-build-index={index}
                className={`roman-build-chip tone-${signTone(sign)} ${
                  selected === index ? 'is-selected' : ''
                } ${drag && dragState.current?.from === index ? 'is-dragging' : ''}`}
                disabled={finished}
                aria-pressed={selected === index}
                aria-label={`Знак ${sign}, место ${index + 1} из ${board.length}`}
                onPointerDown={(event) => beginDrag(event, sign, index)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={cancelDrag}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setSelected((prev) => (prev === index ? null : index));
                  setMessage(`Знак ${sign} выбран: сдвинь или убери.`);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    shift(index, index - 1, true);
                  } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    shift(index, index + 1, true);
                  } else if (event.key === 'Delete' || event.key === 'Backspace') {
                    event.preventDefault();
                    apply(removeSign(board, index), sign);
                  } else if (event.key === 'Escape') {
                    setSelected(null);
                  }
                }}
              >
                <RomanTile sign={sign} size="md" />
              </button>
            </Fragment>
          ))}
          {dropIndex === board.length && <span className="roman-build-caret" aria-hidden="true" />}
          {!board.length && dropIndex === null && (
            <span className="roman-record-empty">Перетащи знак сюда</span>
          )}
        </div>
        {record && (
          <span className="roman-build-value" aria-hidden="true">
            = {value}
          </span>
        )}
      </div>

      <div className="model-tools roman-sign-tray" role="group" aria-label="Знаки">
        {ROMAN_SIGNS.map((item) => (
          <button
            type="button"
            key={item.sign}
            className={`roman-sign-button tone-${signTone(item.sign)}`}
            disabled={finished || solved}
            aria-label={`Добавить ${item.sign}`}
            onPointerDown={(event) => beginDrag(event, item.sign, null)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={cancelDrag}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              apply(insertSign(board, item.sign, board.length));
            }}
          >
            <RomanTile sign={item.sign} size="lg" />
          </button>
        ))}

        {selected !== null && (
          <div className="roman-chip-tools" role="group" aria-label="Выбранный знак">
            <button
              type="button"
              className="button tool-outline"
              onClick={() => shift(selected, selected - 1)}
              disabled={selected === 0}
              aria-label="Сдвинуть знак влево"
              title="Сдвинуть влево"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="button tool-outline"
              onClick={() => shift(selected, selected + 1)}
              disabled={selected >= board.length - 1}
              aria-label="Сдвинуть знак вправо"
              title="Сдвинуть вправо"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        )}

        <button
          type="button"
          className="button tool-remove roman-erase"
          onClick={() => {
            const at = selected ?? board.length - 1;
            apply(removeSign(board, at), board[at]);
          }}
          disabled={!record || finished}
          aria-label={selected === null ? 'Убрать последний знак' : 'Убрать выбранный знак'}
        >
          <Delete size={18} aria-hidden="true" /> Убрать
        </button>
      </div>

      <div className="model-tools roman-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() => {
            setHint(true);
            if (target !== null) setMessage(`Подсказка: ${target} записывают ${toRoman(target)}.`);
          }}
          disabled={finished || solved}
        >
          <Lightbulb size={18} aria-hidden="true" /> Подсказка
        </button>
        <button type="button" className="button tool-outline" onClick={restart}>
          <RotateCcw size={18} aria-hidden="true" /> Заново
        </button>
      </div>

      <p className="roman-game-message" role="status" id={statusId}>
        {message}
      </p>

      <div className="pilot-actions">
        <button type="button" className="button secondary" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" /> К объяснению
        </button>
        {solved && (
          <button type="button" className="button primary" onClick={next}>
            Дальше
          </button>
        )}
        {finished && (
          <button type="button" className="button primary" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" /> Ещё раз
          </button>
        )}
      </div>

      {drag && (
        <span
          className={`roman-build-ghost tone-${signTone(drag.sign)}`}
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <RomanTile sign={drag.sign} size="md" />
        </span>
      )}
    </div>
  );
}
