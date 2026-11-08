import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import {
  clockModel,
  SPOKEN_CLOCK_GAMES,
  SPOKEN_CLOCK_SCENES,
  spokenMinuteChoices,
} from '../engine/clock';
import { ClockDial } from './ClockDial';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

type GameKind = 'match' | 'minutes';
function SpokenGame({ kind, onExit }: { kind: GameKind; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const [minute, setMinute] = useState(0);
  const [result, setResult] = useState<'correct' | 'retry' | null>(null);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (result) feedbackRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [result]);
  const scene = SPOKEN_CLOCK_GAMES[round];
  const reset = () => {
    setRound(0);
    setMinute(0);
    setResult(null);
    setMessage('');
    setHint(false);
  };
  const next = () => {
    setRound(round + 1);
    setMinute(0);
    setResult(null);
    setMessage('');
    setHint(false);
  };
  const check = (ok: boolean) => {
    setResult(ok ? 'correct' : 'retry');
    setHint(false);
    setMessage(
      ok
        ? `${scene.explanation} — ${scene.answer}.`
        : kind === 'match'
          ? 'Посмотри, сколько минут прошло или осталось до часа.'
          : 'Посмотри на длинную стрелку и попробуй другое положение.',
    );
  };
  return (
    <div className="year-game equation-pilot clock-pilot clock-game spoken-clock-pilot">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        {kind === 'match' ? 'Узнай время' : 'Поверни стрелку'}
      </h3>
      <CardGuide kind="Тренажёр">
        {kind === 'match'
          ? 'Прочитай время словами и выбери запись цифрами.'
          : 'Выбери минуты и проверь положение длинной стрелки.'}
      </CardGuide>
      <p className="trainer-instruction">
        {kind === 'match'
          ? 'Как записать время цифрами?'
          : 'Поверни длинную стрелку: выбери минуты.'}
      </p>
      <p className="spoken-clock-words">{scene.words}</p>
      {kind === 'minutes' && (
        <ClockDial
          time={{ hour: scene.time.hour, minute }}
          label={`Короткая стрелка ${minute === 0 ? `на ${scene.time.hour}` : `между ${scene.time.hour} и ${scene.time.hour + 1}`}, длинная показывает ${minute} минут.`}
        />
      )}
      {kind === 'match' ? (
        <div
          className="model-tools equation-choices"
          role="group"
          aria-label="Выбери запись времени"
        >
          {scene.options.map((option) => (
            <button
              className="button tool-outline"
              type="button"
              key={option}
              onClick={() => check(option === scene.answer)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="model-tools equation-choices" role="group" aria-label="Минуты">
            {spokenMinuteChoices(scene.time.minute).map((value) => (
              <button
                className="button tool-outline"
                type="button"
                key={value}
                aria-pressed={minute === value}
                onClick={() => {
                  setMinute(value);
                  setResult(null);
                  setMessage('');
                  setHint(false);
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="button primary clock-check"
            onClick={() => check(minute === scene.time.minute)}
          >
            Проверить часы
          </button>
        </>
      )}
      <div ref={feedbackRef}>
        <div
          className={`clock-feedback ${result ? `is-${result}` : ''}`}
          role="status"
          aria-atomic="true"
        >
          {result && <strong>{result === 'correct' ? '✓ Верно!' : '↻ Попробуй ещё'}</strong>}
          <span>{message || 'Выбери ответ.'}</span>
        </div>
        {result === 'correct' &&
          (round < SPOKEN_CLOCK_GAMES.length - 1 ? (
            <button type="button" className="button primary clock-next" onClick={next}>
              Следующее время <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="button primary clock-next" onClick={reset}>
              Играть снова <RotateCcw size={18} aria-hidden="true" />
            </button>
          ))}
      </div>
      {hint && (
        <p className="clock-hint" role="status">
          {scene.explanation}.
        </p>
      )}
      <div className="model-tools equation-game-tools" role="group" aria-label="Помощь в игре">
        <button type="button" className="button tool-outline" onClick={() => setHint(true)}>
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
      </div>
    </div>
  );
}

export function SpokenClockPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [variant, setVariant] = useState([0, 0, 0]);
  const [game, setGame] = useState<GameKind | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step, game]);
  if (game) return <SpokenGame kind={game} onExit={() => setGame(null)} />;
  const scene = SPOKEN_CLOCK_SCENES[step][variant[step]];
  const model = clockModel(scene.time);
  return (
    <div className="year-month-pilot-v2 equation-pilot clock-pilot spoken-clock-pilot">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        {['Четверть часа', 'Половина часа', 'Минуты до часа'][step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={<StepIndicator count={3} current={step} label={`Шаг ${step + 1} из 3`} />}
      >
        Нажми «Другой пример» и сравни слова с показаниями часов. Игры открываются отдельно.
      </CardGuide>
      <ClockDial
        time={scene.time}
        highlight={scene.part}
        label={`Часы: ${model.digital}. ${scene.words}; выделено ${scene.explanation}.`}
      />
      <p className="spoken-clock-words">{scene.words}</p>
      <p className="clock-readout" role="status">
        <strong>{model.digital}</strong>
        <span>{scene.explanation}</span>
      </p>
      <div
        className="model-tools equation-model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        <button
          type="button"
          className="button tool-outline"
          onClick={() => setVariant((values) => values.map((v, i) => (i === step ? 1 - v : v)))}
        >
          Другой пример
        </button>
      </div>
      <div
        className="model-tools roman-game-entries equation-entries"
        role="group"
        aria-label="Игры"
      >
        <button type="button" className="button tool-outline" onClick={() => setGame('match')}>
          <Puzzle size={18} aria-hidden="true" /> Узнай время
        </button>
        <button type="button" className="button tool-outline" onClick={() => setGame('minutes')}>
          <Puzzle size={18} aria-hidden="true" /> Поверни стрелку
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
