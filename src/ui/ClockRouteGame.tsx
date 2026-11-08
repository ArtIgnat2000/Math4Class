import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, Minus, Plus, RotateCcw } from 'lucide-react';
import { clockModel } from '../engine/clock';
import { CLOCK_ROUTES, routeModel } from '../engine/clock-route';
import { ClockDial } from './ClockDial';
import { CardGuide } from './CardGuide';

/** Unscored exploration: neither the route nor its outcomes enter progress. */
export function ClockRouteGame({ onExit }: { onExit: () => void }) {
  const [routeIndex, setRouteIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const route = CLOCK_ROUTES[routeIndex];
  const state = routeModel(route, elapsed);
  const start = clockModel(state.start).digital;
  const current = clockModel(state.current).digital;
  const end = clockModel(state.end).digital;
  const reset = () => {
    setElapsed(0);
    setHint(false);
  };
  return (
    <div className="year-game equation-pilot clock-pilot clock-game clock-route-game">
      <h3 className="sr-only" ref={heading} tabIndex={-1}>
        Маршрут по часу
      </h3>
      <CardGuide kind="Тренажёр">
        Выбери начало маршрута. Двигай стрелку шагами по пять минут к событию. Можно вернуться
        назад, начать заново или открыть подсказку.
      </CardGuide>
      <p className="trainer-instruction">Выбери начало и шагай по 5 мин.</p>
      <div className="clock-route-choices" role="group" aria-label="Выбери начало маршрута">
        {CLOCK_ROUTES.map((item, index) => {
          const label = clockModel(routeModel(item, 0).start).digital;
          return (
            <button
              type="button"
              className="button tool-outline"
              key={label}
              aria-pressed={index === routeIndex}
              aria-label={`Начало ${label}`}
              onClick={() => {
                setRouteIndex(index);
                reset();
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="clock-route-event">
        {route.event} в <strong>{end}</strong>
      </p>
      <ClockDial
        time={state.current}
        route={{ startMinute: state.startMinute, elapsed, remaining: state.remaining }}
        label={`Начало ${start}. Сейчас ${current}. ${route.event} в ${end}. Прошло ${elapsed} минут, осталось ${state.remaining} минут.`}
      />
      <div className="clock-route-summary" role="status" aria-atomic="true">
        <strong>Сейчас {current}</strong>
        <div>
          <span className="clock-route-passed">Прошло: {elapsed} мин</span>
          <span className="clock-route-remaining">До события: {state.remaining} мин</span>
        </div>
        {state.done && <span className="clock-route-done">✓ Событие началось!</span>}
      </div>
      <div
        className="model-tools equation-model-tools clock-route-controls"
        role="group"
        aria-label="Движение по маршруту"
      >
        <button
          type="button"
          className="button tool-outline"
          aria-label="Назад на 5 минут"
          disabled={elapsed === 0}
          onClick={() => {
            setElapsed(elapsed - 5);
            setHint(false);
          }}
        >
          <Minus size={18} aria-hidden="true" /> 5 минут
        </button>
        <button
          type="button"
          className="button tool-add"
          aria-label="Вперёд на 5 минут"
          disabled={state.done}
          onClick={() => {
            setElapsed(elapsed + 5);
            setHint(false);
          }}
        >
          <Plus size={18} aria-hidden="true" /> 5 минут
        </button>
      </div>
      {hint && (
        <p className="clock-hint" role="status">
          Каждый шаг — 5 минут. Двигайся вперёд до времени события.
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
