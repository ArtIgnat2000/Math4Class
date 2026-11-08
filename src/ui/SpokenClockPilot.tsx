import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import {
  clockModel,
  SPOKEN_CLOCK_GAMES,
  SPOKEN_CLOCK_SCENES,
  spokenMinuteChoices,
  spokenWordOptions,
} from '../engine/clock';
import { ClockDial } from './ClockDial';
import { ClockRouteGame } from './ClockRouteGame';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

type GameKind = 'match' | 'minutes' | 'reverse' | 'route';
function SpokenGame({ kind, onExit }: { kind: Exclude<GameKind, 'route'>; onExit: () => void }) {
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
        ? `${scene.explanation} — ${kind === 'reverse' ? scene.words : scene.answer}.`
        : kind !== 'minutes'
          ? 'Посмотри, сколько минут прошло или осталось до часа.'
          : 'Посмотри на длинную стрелку и попробуй другое положение.',
    );
  };
  return (
    <div className="year-game equation-pilot clock-pilot clock-game spoken-clock-pilot">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        {kind === 'match'
          ? 'Узнай время'
          : kind === 'reverse'
            ? 'Назови словами'
            : 'Поверни стрелку'}
      </h3>
      <CardGuide kind="Тренажёр">
        {kind === 'match'
          ? 'Прочитай время словами и выбери запись цифрами.'
          : kind === 'reverse'
            ? 'Посмотри на часы и выбери название времени.'
            : 'Выбери минуты и проверь положение длинной стрелки.'}
      </CardGuide>
      <p className="trainer-instruction">
        {kind === 'match'
          ? 'Как записать время цифрами?'
          : kind === 'reverse'
            ? 'Как назвать время на часах? Выбери слова.'
            : 'Поверни длинную стрелку: выбери минуты.'}
      </p>
      {kind !== 'reverse' && <p className="spoken-clock-words">{scene.words}</p>}
      {kind === 'reverse' && (
        <ClockDial
          time={scene.time}
          label={`Короткая стрелка между ${scene.time.hour} и ${scene.time.hour + 1}, длинная показывает ${scene.time.minute} минут.`}
        />
      )}
      {kind === 'minutes' && (
        <ClockDial
          time={{ hour: scene.time.hour, minute }}
          label={`Короткая стрелка ${minute === 0 ? `на ${scene.time.hour}` : `между ${scene.time.hour} и ${scene.time.hour + 1}`}, длинная показывает ${minute} минут.`}
        />
      )}
      {kind === 'reverse' ? (
        <div
          className="model-tools equation-choices spoken-word-choices"
          role="group"
          aria-label="Выбери название времени"
        >
          {spokenWordOptions(round).map((option) => (
            <button
              className="button tool-outline"
              type="button"
              key={option}
              onClick={() => check(option === scene.words)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : kind === 'match' ? (
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
  if (game === 'route') return <ClockRouteGame onExit={() => setGame(null)} />;
  if (game) return <SpokenGame kind={game} onExit={() => setGame(null)} />;
  const scene = SPOKEN_CLOCK_SCENES[step][variant[step]];
  const model = clockModel(scene.time);
  return (
    <div className="year-month-pilot-v2 equation-pilot clock-pilot spoken-clock-pilot">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        {['Минуты после часа', 'Половина часа', 'Минуты до часа'][step]}
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
      <p className="spoken-clock-also">или {scene.also}</p>
      <p className="clock-readout" role="status">
        <strong>{model.digital}</strong>
        <span>{scene.explanation}</span>
      </p>
      <p className="spoken-clock-insight">{scene.insight}</p>
      <div
        className="model-tools equation-model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        <button
          type="button"
          className="button tool-outline"
          onClick={() =>
            setVariant((values) =>
              values.map((v, i) => (i === step ? (v + 1) % SPOKEN_CLOCK_SCENES[i].length : v)),
            )
          }
        >
          Другой пример
        </button>
      </div>
      <div
        className="model-tools roman-game-entries equation-entries spoken-game-entries"
        role="group"
        aria-label="Игры"
      >
        <button type="button" className="button tool-outline" onClick={() => setGame('match')}>
          <Puzzle size={18} aria-hidden="true" /> <span>Узнай время</span>
        </button>
        <button type="button" className="button tool-outline" onClick={() => setGame('reverse')}>
          <Puzzle size={18} aria-hidden="true" /> <span>Назови словами</span>
        </button>
        <button type="button" className="button tool-outline" onClick={() => setGame('minutes')}>
          <Puzzle size={18} aria-hidden="true" /> <span>Поверни стрелку</span>
        </button>
        <button type="button" className="button tool-outline" onClick={() => setGame('route')}>
          <Puzzle size={18} aria-hidden="true" /> <span>Маршрут по часу</span>
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
