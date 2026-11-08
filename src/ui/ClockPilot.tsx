import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Puzzle, Type } from 'lucide-react';
import {
  hourProgress,
  nextWholeHour,
  normalizeTime,
  shiftHours,
  shiftMinutes,
  spokenTime,
  type ClockTime,
} from '../engine/clock';
import { CardGuide } from './CardGuide';
import { StepIndicator } from './StepIndicator';
import { ClockDial, ClockProgress, ClockReadout } from './ClockModel';
import { ClockNameGame } from './ClockNameGame';
import { ClockSetGame } from './ClockSetGame';
import { ClockPhraseGame } from './ClockPhraseGame';

const STEP_TITLES = ['Час и минуты', 'Половина и четверть', 'Без … и после'];

/**
 * An author's explanation of telling the time in words: three interactive steps,
 * three games of different mechanics and a separate check from the owner-approved
 * exercises. The coloured arcs are the whole point: green is the part of the hour
 * that has passed, amber is what is left before the next hour.
 */
export function ClockPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [time, setTime] = useState<ClockTime>({ hour: 3, minute: 20 });
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [game, setGame] = useState<'name' | 'set' | 'phrase' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const referenceId = useId();
  const statusId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, game]);

  useEffect(() => {
    if (step === 1) setTime((current) => ({ hour: current.hour, minute: 30 }));
    if (step === 2) setTime((current) => ({ hour: current.hour, minute: 5 }));
  }, [step]);

  if (game === 'name') return <ClockNameGame onExit={() => setGame(null)} />;
  if (game === 'set') return <ClockSetGame onExit={() => setGame(null)} />;
  if (game === 'phrase') return <ClockPhraseGame onExit={() => setGame(null)} />;

  const { minute } = time;
  const status =
    step === 0
      ? 'Минутная стрелка считает минуты, короткая — часы.'
      : step === 1
        ? minute === 30
          ? 'Половина — это 30 минут.'
          : minute === 15
            ? 'Четверть — это 15 минут.'
            : minute === 45
              ? 'Без четверти — до целого часа 15 минут.'
              : 'Нажми «Половина», «Четверть» или «Без четверти».'
        : minute >= 35
          ? `До целого часа не хватает ${hourProgress(time).remaining} мин: без …`
          : minute === 0
            ? 'Минутная на 12 — ровно целый час.'
            : 'Сначала минуты, потом час: пять минут восьмого.';

  return (
    <div className="clock-pilot">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        {STEP_TITLES[step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={
          <div className="pilot-topline">
            <StepIndicator
              count={STEP_TITLES.length}
              current={step}
              label={`Шаг ${step + 1} из ${STEP_TITLES.length}`}
            />
          </div>
        }
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="Как называть время"
            title="Как называть время"
            aria-expanded={referenceOpen}
            aria-controls={referenceId}
            onClick={() => setReferenceOpen((open) => !open)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        {
          [
            'Меняй час и минуту и смотри на цветную дугу.',
            'Выбери половину или четверть и посмотри на стрелки.',
            'Двигай минуты к целому часу и читай «без …».',
          ][step]
        }
      </CardGuide>

      <div
        id={referenceId}
        className="pilot-season-reference clock-reference"
        aria-label="Как называть время"
        hidden={!referenceOpen}
      >
        <p>Меньше половины — называем следующий час.</p>
        <p>7:10 — десять минут восьмого.</p>
        <p>Потом ровно 30 минут — половина восьмого.</p>
        <p>Больше половины — считаем, сколько не хватает: 7:50 — без десяти восемь.</p>
        <p>Ровно — 7:00 — семь часов.</p>
      </div>

      <ClockDial time={time} />
      <ClockReadout time={time} />
      <ClockProgress time={time} />

      <p className="clock-status" role="status" id={statusId}>
        {status}
      </p>

      {step === 0 && (
        <section aria-label="Час и минуты">
          <p className="pilot-instruction sr-only">
            Меняй час и минуты и смотри, как цветная дуга показывает прошедшую часть часа.
          </p>
          <div className="pilot-model-controls model-tools" role="group" aria-label="Часы">
            <button
              type="button"
              className="button tool-add"
              onClick={() => setTime(shiftHours(time, 1))}
            >
              Другой час
            </button>
            <button
              type="button"
              className="button tool-add"
              onClick={() => setTime(shiftMinutes(time, 5))}
            >
              Другая минута
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Половина и четверть">
          <p className="pilot-instruction sr-only">
            Выбери, сколько минут прошло: четверть, половину или без четверти. Смотри на стрелки.
          </p>
          <div className="clock-form-cards" role="group" aria-label="Доли часа">
            {[
              { label: 'Четверть', minute: 15 },
              { label: 'Половина', minute: 30 },
              { label: 'Без четверти', minute: 45 },
            ].map((item) => (
              <button
                key={item.minute}
                type="button"
                className={`clock-form-card ${minute === item.minute ? 'is-active' : ''}`}
                aria-pressed={minute === item.minute}
                onClick={() => setTime(normalizeTime(time.hour, item.minute))}
              >
                <strong>{item.minute} мин</strong>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="pilot-model-controls model-tools" role="group" aria-label="Час">
            <button
              type="button"
              className="button tool-outline"
              onClick={() => setTime(shiftHours(time, 1))}
            >
              Другой час
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section aria-label="Без … и после целого">
          <p className="pilot-instruction sr-only">
            Двигай минутную стрелку по пять минут и читай, как называется время до и после половины.
          </p>
          <div className="clock-step-words">
            <span>{minute === 0 ? 'ровно' : minute <= 30 ? 'после целого' : 'до целого'}</span>
            <strong>
              {spokenTime(minute === 0 ? time : { hour: nextWholeHour(time.hour), minute: 0 })}
            </strong>
          </div>
          <div className="pilot-model-controls model-tools" role="group" aria-label="Минуты">
            <button
              type="button"
              className="button tool-remove"
              aria-label="−5 мин: убрать пять минут"
              onClick={() => setTime(shiftMinutes(time, -5))}
            >
              −5 мин
            </button>
            <button
              type="button"
              className="button tool-add"
              aria-label="+5 мин: добавить пять минут"
              onClick={() => setTime(shiftMinutes(time, 5))}
            >
              +5 мин
            </button>
            <button
              type="button"
              className="button tool-outline"
              onClick={() => setTime(shiftHours(time, 1))}
            >
              Другой час
            </button>
          </div>
        </section>
      )}

      <div className="model-tools roman-game-entries" role="group" aria-label="Игры">
        <button
          type="button"
          className="button tool-outline"
          aria-label="Игра «Назови время»"
          onClick={() => setGame('name')}
        >
          <Clock size={18} aria-hidden="true" /> Назови время
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Игра «Поставь стрелки»"
          onClick={() => setGame('set')}
        >
          <Puzzle size={18} aria-hidden="true" /> Поставь стрелки
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Игра «Собери фразу»"
          onClick={() => setGame('phrase')}
        >
          <Type size={18} aria-hidden="true" /> Собери фразу
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

export const CLOCK_STEP_TITLES = STEP_TITLES;
