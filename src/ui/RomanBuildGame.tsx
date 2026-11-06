import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Delete, Lightbulb, RotateCcw } from 'lucide-react';
import {
  BUILD_TARGETS,
  ROMAN_SIGNS,
  appendSign,
  romanIssue,
  romanIssueText,
  romanValue,
  toRoman,
  type RomanSign,
} from '../engine/roman';
import { RomanRecord, RomanTile, signTone } from './RomanModel';

const START_HINT = 'Нажми или перетащи знак в запись.';

/**
 * «Собери число» — a constructor mechanic: the child builds the record of a
 * number from I, V and X. Wrong records are refused with the rule that was
 * broken, never with a penalty. No points, no storage, no checked session.
 */
export function RomanBuildGame({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [record, setRecord] = useState('');
  const [message, setMessage] = useState(START_HINT);
  const [hint, setHint] = useState(false);
  const [over, setOver] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const statusId = useId();

  const target = BUILD_TARGETS[step] ?? null;
  const finished = target === null;
  const value = romanValue(record);
  const solved = !finished && value === target && romanIssue(record) === null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (finished) setMessage('Все числа собраны!');
  }, [finished]);

  const add = (sign: RomanSign) => {
    if (finished || solved) return;
    const next = appendSign(record, sign);
    if (next.issue) {
      setMessage(next.message ?? START_HINT);
      return;
    }
    setRecord(next.record);
    setHint(false);
    if (next.value === target) {
      setMessage(`${next.record} — это ${next.value}. Верно!`);
    } else {
      setMessage(`${next.record} — это ${next.value}. Нужно ${target}.`);
    }
  };

  const next = () => {
    setStep((prev) => prev + 1);
    setRecord('');
    setHint(false);
    setMessage(START_HINT);
  };

  const restart = () => {
    setStep(0);
    setRecord('');
    setHint(false);
    setMessage(START_HINT);
  };

  return (
    <div className="roman-game roman-build-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Собери число
      </h3>

      <div className="roman-build-target" aria-live="polite">
        {finished ? (
          <strong className="roman-build-done">Готово!</strong>
        ) : (
          <>
            <span className="roman-build-caption">Собери</span>
            <strong>{target}</strong>
            {hint && <span className="roman-build-hint">{toRoman(target)}</span>}
          </>
        )}
      </div>

      <div
        ref={dropRef}
        className={`roman-build-drop ${over ? 'is-over' : ''} ${solved ? 'is-solved' : ''}`}
        role="group"
        aria-label="Запись числа"
        aria-describedby={statusId}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const sign = event.dataTransfer.getData('text/plain') as RomanSign;
          if (ROMAN_SIGNS.some((item) => item.sign === sign)) add(sign);
        }}
      >
        <RomanRecord record={record} placeholder="Перетащи знак сюда" />
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
            draggable={!finished && !solved}
            disabled={finished || solved}
            aria-label={`Добавить ${item.sign}`}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', item.sign);
              event.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => add(item.sign)}
          >
            <RomanTile sign={item.sign} size="lg" />
          </button>
        ))}
        <button
          type="button"
          className="button tool-remove roman-erase"
          onClick={() => {
            setRecord((prev) => prev.slice(0, -1));
            setMessage(START_HINT);
          }}
          disabled={!record || finished}
          aria-label="Убрать последний знак"
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
        {!finished && !solved && record && romanIssue(record)
          ? ` ${romanIssueText(romanIssue(record)!, record)}`
          : ''}
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
    </div>
  );
}
