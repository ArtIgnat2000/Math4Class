import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw } from 'lucide-react';
import { YEAR_MATCH_SCENES, yearMatchFeedback, yearMatchTotal } from '../engine/year-match';
import { plural } from '../engine/dates';
import { CardGuide } from './CardGuide';
import { MonthSector, YearRing } from './CalendarModel';

/** Matching counts to models is exploration, not a scored textbook exercise. */
export function YearMatchGame({ onExit }: { onExit: () => void }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scene = YEAR_MATCH_SCENES[sceneIndex];
  const solved = choice === yearMatchTotal(scene);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const restart = () => {
    setSceneIndex(0);
    setChoice(null);
    setHint(false);
  };
  const next = () => {
    setSceneIndex((value) => value + 1);
    setChoice(null);
    setHint(false);
  };

  return (
    <div className="year-game year-match-game">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        Считаем месяцы
      </h3>
      <CardGuide kind="Тренажёр">
        Посмотри на круги и отдельные месяцы. Выбери, сколько месяцев вместе. Подсказка помогает
        посчитать. Игра не оценивается.
      </CardGuide>
      <p className="year-match-prompt">Сколько месяцев вместе?</p>
      <div
        className="year-groups"
        role="group"
        aria-label={`${scene.years} ${plural(scene.years, ['год', 'года', 'лет'])} по 12 месяцев`}
      >
        {Array.from({ length: scene.years }, (_, index) => (
          <div className="year-group-card" key={index}>
            <div className="year-group-ring">
              <YearRing label={`${index + 1}-й год: 12 месяцев`} />
              <strong aria-hidden="true">12</strong>
            </div>
            <span>1 год</span>
          </div>
        ))}
      </div>
      {scene.extra > 0 && (
        <div className="year-match-extra">
          <span className="extra-month-token">
            <MonthSector label="1 отдельный месяц" showLabel={false} />
          </span>
          <span>Ещё 1 месяц</span>
        </div>
      )}
      <div
        className="model-tools year-match-choices"
        role="group"
        aria-label="Выбери число месяцев"
      >
        {scene.choices.map((value) => (
          <button
            key={value}
            type="button"
            className={`button ${choice === value ? 'tool-add' : 'tool-outline'}`}
            aria-pressed={choice === value}
            onClick={() => {
              setChoice(value);
              setHint(false);
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="year-game-message" role="status" aria-live="polite">
        {hint
          ? 'В каждом круге 12 месяцев. Сложи их и добавь отдельные месяцы.'
          : choice === null
            ? 'Нажми число месяцев.'
            : yearMatchFeedback(scene, choice)}
      </p>
      <div className="model-tools year-game-tools" role="group" aria-label="Помощь в игре">
        <button type="button" className="button tool-outline" onClick={() => setHint(true)}>
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
        {solved && sceneIndex < YEAR_MATCH_SCENES.length - 1 && (
          <button type="button" className="button primary" onClick={next}>
            Дальше <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
        {solved && sceneIndex === YEAR_MATCH_SCENES.length - 1 && (
          <button type="button" className="button primary" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" /> Ещё раз
          </button>
        )}
      </div>
    </div>
  );
}
