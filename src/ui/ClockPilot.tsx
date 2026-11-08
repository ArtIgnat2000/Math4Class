import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Puzzle, RotateCcw } from 'lucide-react';
import {
  CLOCK_AFTERNOON_HOURS,
  CLOCK_MINUTES,
  CLOCK_READ_ROUNDS,
  CLOCK_SET_ROUNDS,
  clockModel,
  nextClockValue,
} from '../engine/clock';
import { ClockDial } from './ClockDial';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';

type GameKind = 'read' | 'set';

function ClockGame({ kind, onExit }: { kind: GameKind; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<'correct' | 'retry' | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [hour, setHour] = useState(4);
  const [evening, setEvening] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (result) feedbackRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [result]);
  const clearFeedback = () => {
    setMessage('');
    setResult(null);
    setHint(false);
  };
  const reset = () => {
    setRound(0);
    clearFeedback();
    setChoice(null);
    setHour(4);
    setEvening(false);
  };
  const chosen = hour + (evening ? 12 : 0);
  const scene = kind === 'read' ? CLOCK_READ_ROUNDS[round] : CLOCK_SET_ROUNDS[round];
  const target = scene.hour;
  const dialHour = target - 12;
  const display = `${String(target).padStart(2, '0')}:00`;
  const advance = () => {
    setRound(round + 1);
    clearFeedback();
    setChoice(null);
    setHour(CLOCK_SET_ROUNDS[Math.min(round + 1, CLOCK_SET_ROUNDS.length - 1)].choices[0]);
    setEvening(false);
  };
  const feedback = (
    <div ref={feedbackRef}>
      <div
        className={`clock-feedback ${result ? `is-${result}` : ''}`}
        role="status"
        aria-atomic="true"
      >
        {result && <strong>{result === 'correct' ? '✓ Верно!' : '↻ Попробуй ещё'}</strong>}
        <span>
          {message ||
            (kind === 'read' ? 'Нажми подходящее время.' : 'Выбери настройки и проверь часы.')}
        </span>
      </div>
      {result === 'correct' &&
        (round < (kind === 'read' ? CLOCK_READ_ROUNDS.length : CLOCK_SET_ROUNDS.length) - 1 ? (
          <button type="button" className="button primary clock-next" onClick={advance}>
            Следующие часы <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="button primary clock-next" onClick={reset}>
            Играть снова <RotateCcw size={18} aria-hidden="true" />
          </button>
        ))}
    </div>
  );
  return (
    <div className="year-game equation-pilot clock-pilot clock-game">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        {kind === 'read' ? 'Прочитай часы' : 'Настрой часы'}
      </h3>
      <CardGuide kind="Тренажёр">
        {kind === 'read'
          ? 'Посмотри на стрелки и время суток. Нажми подходящую цифровую запись.'
          : 'Выбери час и половину суток, затем нажми «Проверить часы».'}
      </CardGuide>
      {kind === 'read' ? (
        <>
          <p className="trainer-instruction">Вечер. Какая запись подходит? Нажми её.</p>
          <ClockDial
            time={{ hour: target, minute: 0 }}
            label={`Вечер: длинная стрелка на 12, короткая на ${dialHour}`}
          />
          <div
            className="model-tools equation-choices"
            role="group"
            aria-label="Выбери запись времени"
          >
            {CLOCK_READ_ROUNDS[round].options.map((value) => (
              <button
                type="button"
                className="button tool-outline"
                key={value}
                aria-pressed={choice === value}
                onClick={() => {
                  setChoice(value);
                  setHint(false);
                  setResult(value === target ? 'correct' : 'retry');
                  setMessage(
                    value === target
                      ? `Вечером ${dialHour} часов — это ${display}.`
                      : `Вечером к ${dialHour} часам прибавь 12.`,
                  );
                }}
              >
                {String(value).padStart(2, '0')}:00
              </button>
            ))}
          </div>
          {feedback}
        </>
      ) : (
        <>
          <p className="trainer-instruction">
            Настрой часы на {display}. Выбери час и половину суток.
          </p>
          <ClockDial
            time={{ hour: chosen, minute: 0 }}
            label={`Длинная стрелка на 12, короткая на ${hour}. ${evening ? 'Вторая' : 'Первая'} половина суток.`}
          />
          <div className="model-tools equation-choices" role="group" aria-label="Час на циферблате">
            {CLOCK_SET_ROUNDS[round].choices.map((value) => (
              <button
                type="button"
                className="button tool-outline"
                key={value}
                aria-pressed={hour === value}
                onClick={() => {
                  setHour(value);
                  clearFeedback();
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="model-tools equation-choices" role="group" aria-label="Половина суток">
            <button
              type="button"
              className="button tool-outline"
              aria-pressed={!evening}
              onClick={() => {
                setEvening(false);
                clearFeedback();
              }}
            >
              До полудня
            </button>
            <button
              type="button"
              className="button tool-outline"
              aria-pressed={evening}
              onClick={() => {
                setEvening(true);
                clearFeedback();
              }}
            >
              После полудня
            </button>
          </div>
          <button
            type="button"
            className="button primary clock-check"
            onClick={() => {
              setHint(false);
              setResult(chosen === target ? 'correct' : 'retry');
              setMessage(
                chosen === target
                  ? `${dialHour} часов после полудня — это ${display}.`
                  : hour !== dialHour
                    ? `Посмотри на короткую стрелку: ${target} − 12 = ${dialHour}.`
                    : `${target} часов — это после полудня.`,
              );
            }}
          >
            Проверить часы
          </button>
          {feedback}
        </>
      )}
      {hint && (
        <p className="clock-hint" role="status">
          {kind === 'read'
            ? 'После полудня к часу на циферблате прибавляют 12.'
            : `${target} — это 12 и ещё ${dialHour} часов.`}
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

export function ClockPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [secondHalf, setSecondHalf] = useState(false);
  const [hour, setHour] = useState(5);
  const [minute, setMinute] = useState(10);
  const [minutePart, setMinutePart] = useState<'passed' | 'remaining'>('passed');
  const [game, setGame] = useState<GameKind | null>(null);
  const [reference, setReference] = useState(false);
  const referenceId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step, game]);
  if (game) return <ClockGame kind={game} onExit={() => setGame(null)} />;
  const current =
    step === 0
      ? { hour: secondHalf ? 16 : 4, minute: 0 }
      : step === 1
        ? { hour: hour + 12, minute: 0 }
        : { hour: 6, minute };
  const model = clockModel(current);
  const descriptions = [
    'На циферблате 4 часа. Переключи половину суток.',
    'Меняй час после полудня.',
    'Меняй минуты и следи за длинной стрелкой.',
  ];
  return (
    <div className="year-month-pilot-v2 equation-pilot clock-pilot">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        {['Две половины суток', 'Время после полудня', 'Минутная стрелка'][step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={<StepIndicator count={3} current={step} label={`Шаг ${step + 1} из 3`} />}
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="О часах"
            aria-expanded={reference}
            aria-controls={referenceId}
            onClick={() => setReference(!reference)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        Меняй показания кнопками. Открой игру или перейди к следующему шагу.
      </CardGuide>
      {reference && (
        <div id={referenceId} className="pilot-season-reference">
          <p>В сутках 24 часа. До полудня и после полудня стрелки проходят один и тот же круг.</p>
          <p>Короткая стрелка показывает часы, длинная — минуты.</p>
        </div>
      )}
      <p className="sr-only">{descriptions[step]}</p>
      <ClockDial
        time={current}
        highlight={step === 2 ? minutePart : undefined}
        label={`Короткая стрелка показывает ${model.dialHour} ${current.minute ? 'и немного дальше' : ''}, длинная на ${current.minute === 0 ? 12 : current.minute / 5}.${step === 2 ? ` Отмечено: ${minutePart === 'passed' ? `прошло ${minute}` : `осталось ${60 - minute}`} минут.` : ''}`}
      />
      <p className="clock-readout" role="status">
        <strong>{model.digital}</strong>{' '}
        <span>
          {step === 0
            ? secondHalf
              ? 'после полудня'
              : 'до полудня'
            : step === 1
              ? `${hour} ч после полудня`
              : minutePart === 'passed'
                ? `прошло ${minute} мин`
                : `осталось ${60 - minute} мин`}
        </span>
      </p>
      <div
        className="model-tools equation-model-tools"
        role="group"
        aria-label="Инструменты модели"
      >
        {step === 0 ? (
          <button
            type="button"
            className="button tool-outline"
            onClick={() => setSecondHalf(!secondHalf)}
          >
            {secondHalf ? 'До полудня' : 'После полудня'}
          </button>
        ) : step === 1 ? (
          <button
            type="button"
            className="button tool-outline"
            onClick={() => setHour(nextClockValue(CLOCK_AFTERNOON_HOURS, hour))}
          >
            Другой час
          </button>
        ) : (
          <button
            type="button"
            className="button tool-outline"
            onClick={() => setMinute(nextClockValue(CLOCK_MINUTES, minute))}
          >
            Другие минуты
          </button>
        )}
      </div>
      {step === 2 && (
        <div className="model-tools equation-model-tools" role="group" aria-label="Часть часа">
          <button
            type="button"
            className="button tool-outline"
            aria-pressed={minutePart === 'passed'}
            onClick={() => setMinutePart('passed')}
          >
            Прошло
          </button>
          <button
            type="button"
            className="button tool-outline"
            aria-pressed={minutePart === 'remaining'}
            onClick={() => setMinutePart('remaining')}
          >
            Осталось
          </button>
        </div>
      )}
      {step === 1 && (
        <p className="equation-message">
          {hour} + 12 = {hour + 12} часов
        </p>
      )}
      <div
        className="model-tools roman-game-entries equation-entries"
        role="group"
        aria-label="Игры"
      >
        <button type="button" className="button tool-outline" onClick={() => setGame('read')}>
          <Puzzle size={18} aria-hidden="true" /> Прочитай часы
        </button>
        <button type="button" className="button tool-outline" onClick={() => setGame('set')}>
          <Puzzle size={18} aria-hidden="true" /> Настрой часы
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
