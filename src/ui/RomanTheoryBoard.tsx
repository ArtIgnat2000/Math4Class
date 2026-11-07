import { Fragment, useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import {
  ROMAN_SIGNS,
  romanIssue,
  romanIssueText,
  romanCalculation,
  romanValue,
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

type Gesture = {
  sign: RomanSign;
  from: number | null;
  x: number;
  y: number;
  active: boolean;
  id: number;
};

/** Editable explanation board: same mathematical rules as the building game. */
export function RomanTheoryBoard({
  board,
  onChange,
}: {
  board: RomanSign[];
  onChange: (board: RomanSign[]) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ sign: RomanSign; x: number; y: number } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const statusId = useId();
  const record = board.join('');
  const issue = romanIssue(record);
  const value = issue ? null : romanValue(record);

  useEffect(() => {
    if (focusIndex === null) return;
    dropRef.current?.querySelector<HTMLElement>(`[data-theory-index="${focusIndex}"]`)?.focus();
    setFocusIndex(null);
  }, [focusIndex, board]);

  const apply = (result: RomanBoard, selection: number | null = null) => {
    if (result.refusal) {
      setNote(result.refusal);
      return;
    }
    onChange(result.signs);
    setSelected(selection);
    setNote(
      result.issue && result.issue !== 'empty'
        ? romanIssueText(result.issue, result.signs.join(''))
        : null,
    );
  };
  const shift = (index: number, to: number, focus = false) => {
    const at = Math.max(0, Math.min(to, board.length - 1));
    const result = moveSign(board, index, at);
    apply(result, result.refusal ? index : at);
    if (focus && !result.refusal && at !== index) setFocusIndex(at);
  };
  const remove = (index: number, focus = false) => {
    apply(removeSign(board, index));
    if (focus) {
      if (board.length === 1) addRef.current?.focus();
      else setFocusIndex(Math.min(index, board.length - 2));
    }
  };
  const boxes = () =>
    Array.from(dropRef.current?.querySelectorAll<HTMLElement>('[data-theory-index]') ?? []).map(
      (node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, width: box.width };
      },
    );
  const begin = (event: PointerEvent<HTMLButtonElement>, sign: RomanSign, from: number | null) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClick.current = false;
    gesture.current = {
      sign,
      from,
      x: event.clientX,
      y: event.clientY,
      active: false,
      id: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const state = gesture.current;
    if (!state || state.id !== event.pointerId) return;
    if (!state.active && Math.hypot(event.clientX - state.x, event.clientY - state.y) < 6) return;
    state.active = true;
    setDrag({ sign: state.sign, x: event.clientX, y: event.clientY });
    setDropIndex(
      insideBoard(event.clientX, event.clientY, dropRef.current?.getBoundingClientRect() ?? null)
        ? dropIndexAt(event.clientX, boxes())
        : null,
    );
  };
  const cancel = () => {
    gesture.current = null;
    setDrag(null);
    setDropIndex(null);
  };
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    const state = gesture.current;
    cancel();
    if (!state?.active || state.id !== event.pointerId) return;
    suppressClick.current = true;
    if (
      insideBoard(event.clientX, event.clientY, dropRef.current?.getBoundingClientRect() ?? null)
    ) {
      const at = dropIndexAt(event.clientX, boxes());
      if (state.from === null) apply(insertSign(board, state.sign, at));
      else apply(moveSign(board, state.from, at > state.from ? at - 1 : at));
    } else if (state.from !== null) remove(state.from);
  };

  return (
    <div className="roman-theory-editor">
      <p className="roman-theory-instruction">
        Перетащи знак. Или выбери знак на табло и нажми стрелку.
      </p>
      <div
        ref={dropRef}
        className={`roman-build-drop ${dropIndex !== null ? 'is-over' : ''}`}
        role="group"
        aria-label="Табло римских цифр"
        aria-describedby={statusId}
      >
        <div className="roman-build-slots">
          {board.map((sign, index) => (
            <Fragment key={`${sign}${index}`}>
              {dropIndex === index && <span className="roman-build-caret" aria-hidden="true" />}
              <button
                type="button"
                data-theory-index={index}
                className={`roman-build-chip tone-${signTone(sign)} ${selected === index ? 'is-selected' : ''} ${drag && gesture.current?.from === index ? 'is-dragging' : ''}`}
                aria-pressed={selected === index}
                aria-label={`Знак ${sign}, место ${index + 1} из ${board.length}`}
                onPointerDown={(event) => begin(event, sign, index)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={cancel}
                onClick={(event) => {
                  if (suppressClick.current && event.detail !== 0) {
                    suppressClick.current = false;
                    return;
                  }
                  suppressClick.current = false;
                  setSelected((prev) => (prev === index ? null : index));
                  setNote(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    shift(index, index + (event.key === 'ArrowLeft' ? -1 : 1), true);
                  } else if (event.key === 'Delete' || event.key === 'Backspace') {
                    event.preventDefault();
                    remove(index, true);
                  } else if (event.key === 'Escape') setSelected(null);
                }}
              >
                <RomanTile sign={sign} />
              </button>
            </Fragment>
          ))}
          {dropIndex === board.length && <span className="roman-build-caret" aria-hidden="true" />}
          {!board.length && dropIndex === null && (
            <span className="roman-record-empty">Добавь знак</span>
          )}
        </div>
      </div>
      <div className="pilot-formula" aria-live="polite">
        {value !== null ? (
          <>
            <span>{romanCalculation(record)}</span>
            <strong className="pilot-formula-result">
              {record} = {value}
            </strong>
          </>
        ) : (
          <strong className="pilot-formula-result">
            {record ? 'Исправь запись' : 'Добавь знак'}
          </strong>
        )}
      </div>
      <div
        className="pilot-model-controls model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        <button
          type="button"
          className="button tool-remove"
          disabled={!board.length}
          aria-label="Убрать знак"
          onClick={() => remove(selected ?? board.length - 1, board.length === 1)}
        >
          <Minus size={18} aria-hidden="true" /> Убрать
        </button>
        {ROMAN_SIGNS.map((item, index) => (
          <button
            ref={index === 0 ? addRef : undefined}
            type="button"
            key={item.sign}
            className={`button tool-add roman-add tone-${signTone(item.sign)}`}
            aria-label={`Добавить ${item.sign}`}
            onPointerDown={(event) => begin(event, item.sign, null)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={cancel}
            onClick={(event) => {
              if (suppressClick.current && event.detail !== 0) {
                suppressClick.current = false;
                return;
              }
              suppressClick.current = false;
              apply(insertSign(board, item.sign, selected === null ? board.length : selected + 1));
            }}
          >
            <Plus size={16} aria-hidden="true" /> {item.sign}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="roman-theory-shift" role="group" aria-label="Выбранный знак">
          <span>Выбран {board[selected]}:</span>
          <button
            type="button"
            className="button tool-outline"
            disabled={selected === 0}
            onClick={() => shift(selected, selected - 1, true)}
            aria-label="Сдвинуть знак влево"
          >
            <ChevronLeft size={18} aria-hidden="true" /> Влево
          </button>
          <button
            type="button"
            className="button tool-outline"
            disabled={selected === board.length - 1}
            onClick={() => shift(selected, selected + 1, true)}
            aria-label="Сдвинуть знак вправо"
          >
            Вправо <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="roman-status" role="status" id={statusId}>
        {note ??
          (selected !== null
            ? 'Новый знак встанет после выбранного.'
            : 'Выбери знак или вытащи его с табло.')}
      </p>
      {drag && (
        <span
          className={`roman-build-ghost tone-${signTone(drag.sign)}`}
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <RomanTile sign={drag.sign} />
        </span>
      )}
    </div>
  );
}
