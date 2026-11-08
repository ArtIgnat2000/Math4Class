import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react';
import {
  buildPhraseFeedback,
  digitalTime,
  phraseChips,
  phraseWords,
  pickTime,
  spokenTime,
  type ClockTime,
  type PhraseChip,
} from '../engine/clock';
import { CardGuide } from './CardGuide';
import { ClockDial } from './ClockModel';

const START_HINT = 'Собери название времени по порядку слов.';

type Round = { time: ClockTime; chips: PhraseChip[] };

function freshRound(previous: ClockTime | null): Round {
  const time = pickTime(previous);
  return { time, chips: phraseChips(time) };
}

/**
 * «Собери фразу» — the wording is built word by word, so the Russian order
 * («без двадцати восемь») becomes a visible action. One extra chip does not
 * belong; a refused chip never removes what is already built.
 */
export function ClockPhraseGame({ onExit }: { onExit: () => void }) {
  const [round, setRound] = useState(() => freshRound(null));
  const [placed, setPlaced] = useState<PhraseChip[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const [message, setMessage] = useState(START_HINT);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const missTimer = useRef<number | undefined>(undefined);
  const statusId = useId();

  const { time, chips } = round;
  const words = phraseWords(time);
  const done = placed.length === words.length;

  useEffect(() => {
    headingRef.current?.focus();
    return () => window.clearTimeout(missTimer.current);
  }, []);

  const restart = () => {
    window.clearTimeout(missTimer.current);
    setRound(freshRound(time));
    setPlaced([]);
    setMiss(null);
    setMessage(START_HINT);
  };

  const place = (chip: PhraseChip) => {
    if (done || placed.some((item) => item.id === chip.id)) return;
    const words_ = [...placed.map((item) => item.word), chip.word];
    const feedback = buildPhraseFeedback(words_, time);
    if (feedback) {
      setMiss(chip.id);
      setMessage(feedback);
      window.clearTimeout(missTimer.current);
      missTimer.current = window.setTimeout(() => setMiss(null), 900);
      return;
    }
    const next = [...placed, chip];
    setMiss(null);
    setPlaced(next);
    setMessage(
      next.length === words.length
        ? `${digitalTime(time)} — ${spokenTime(time)}. Верно!`
        : 'Дальше — следующее слово.',
    );
  };

  return (
    <div className="clock-game clock-phrase-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Собери фразу
      </h3>
      <CardGuide kind="Тренажёр">
        Посмотри на часы и собери название из слов. Лишнее слово не подходит. Игра не оценивается.
      </CardGuide>

      <ClockDial time={time} tone="play" />

      <div
        className={`clock-phrase ${done ? 'is-done' : ''}`}
        role="group"
        aria-label={`Собранная фраза: ${placed.map((item) => item.word).join(' ') || 'пусто'}`}
      >
        {placed.map((chip, index) => (
          <button
            key={chip.id}
            type="button"
            className="clock-phrase-word"
            aria-label={`${chip.word}: убрать`}
            onClick={() => {
              setPlaced(placed.slice(0, index));
              setMessage(START_HINT);
            }}
          >
            {chip.word}
          </button>
        ))}
        {!placed.length && <span className="clock-phrase-empty">Собери название</span>}
      </div>

      <div className="clock-chips" role="group" aria-label="Слова">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`clock-chip ${placed.some((item) => item.id === chip.id) ? 'is-used' : ''} ${
              miss === chip.id ? 'is-miss' : ''
            }`}
            disabled={placed.some((item) => item.id === chip.id) || done}
            aria-label={`Слово «${chip.word}»`}
            onClick={() => place(chip)}
          >
            {chip.word}
          </button>
        ))}
      </div>

      <p className={`roman-game-message ${done ? 'is-done' : ''}`} role="status" id={statusId}>
        {message}
      </p>

      <div className="model-tools roman-game-tools" role="group" aria-label="Помощь в игре">
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setMessage(
              words[0] === 'без'
                ? 'Начни с «без»: называем, сколько минут не хватает.'
                : words[0] === 'половина' || words[0] === 'четверть'
                  ? `Начни со слова «${words[0]}».`
                  : 'Начни с числа минут.',
            )
          }
          disabled={done}
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
        {done && (
          <button type="button" className="button primary" onClick={restart}>
            Ещё время
          </button>
        )}
      </div>
    </div>
  );
}
