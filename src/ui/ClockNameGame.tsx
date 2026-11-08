import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react';
import {
  digitalTime,
  phraseChoices,
  pickTime,
  spokenTime,
  type ClockTime,
  type PhraseChoice,
} from '../engine/clock';
import { CardGuide } from './CardGuide';
import { ClockDial } from './ClockModel';

const START_HINT = 'Посмотри на часы и выбери, как назвать время.';

function freshRound(previous: ClockTime | null): { time: ClockTime; choices: PhraseChoice[] } {
  const time = pickTime(previous);
  return { time, choices: phraseChoices(time) };
}

/**
 * «Назови время» — matching a dial and a wording. Twelve hours times twelve
 * five-minute positions give 144 variants; the checked exercises are excluded.
 * No points, no timer, no storage.
 */
export function ClockNameGame({ onExit }: { onExit: () => void }) {
  const [round, setRound] = useState(() => freshRound(null));
  const [picked, setPicked] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [message, setMessage] = useState(START_HINT);
  const [hint, setHint] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const missTimer = useRef<number | undefined>(undefined);
  const statusId = useId();

  const { time, choices } = round;
  const solved = choices.some((choice) => choice.correct && choice.id === picked);

  useEffect(() => {
    headingRef.current?.focus();
    return () => window.clearTimeout(missTimer.current);
  }, []);

  const restart = () => {
    window.clearTimeout(missTimer.current);
    setRound(freshRound(time));
    setPicked(null);
    setMiss(null);
    setHint(false);
    setMessage(START_HINT);
  };

  const attempt = (choice: PhraseChoice) => {
    setPicked(choice.id);
    setHint(false);
    if (choice.correct) {
      setMiss(null);
      setMessage(`${digitalTime(time)} — ${spokenTime(time)}. Верно!`);
      return;
    }
    setMiss(choice.id);
    setMessage(
      choice.at.hour !== time.hour
        ? `Это ${digitalTime(choice.at)}: назван не тот час.`
        : 'Перепутаны «прошло» и «осталось».',
    );
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(null), 900);
  };

  return (
    <div className="clock-game clock-name-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Назови время
      </h3>
      <CardGuide kind="Тренажёр">
        Посмотри, сколько прошло и сколько осталось, и выбери подходящие слова. Игра не оценивается.
      </CardGuide>
      <p className="trainer-instruction">Как называется это время?</p>

      <ClockDial time={time} tone="play" />

      <div className="clock-choices" role="group" aria-label="Варианты названия времени">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`clock-choice ${picked === choice.id && choice.correct ? 'is-correct' : ''} ${
              miss === choice.id ? 'is-miss' : ''
            }`}
            onClick={() => attempt(choice)}
          >
            {choice.label}
          </button>
        ))}
      </div>

      <p className={`roman-game-message ${solved ? 'is-done' : ''}`} role="status" id={statusId}>
        {message}
      </p>

      <div className="model-tools roman-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() => {
            setHint(true);
            setMessage(
              time.minute > 30
                ? `Прошло ${time.minute} минут — больше половины: считаем, сколько не хватает.`
                : time.minute === 0
                  ? 'Минутная на 12 — называют этот час.'
                  : `Прошло ${time.minute} минут — меньше половины: называем следующий час.`,
            );
          }}
        >
          <Lightbulb size={18} aria-hidden="true" /> Подсказка
        </button>
        <button type="button" className="button tool-outline" onClick={restart}>
          <RotateCcw size={18} aria-hidden="true" /> Заново
        </button>
      </div>

      {hint && <span className="sr-only">Подсказка открыта.</span>}

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
