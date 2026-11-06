import { StepIndicator } from './StepIndicator';
import { CardGuide } from './CardGuide';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Minus, Plus, Puzzle, RotateCcw } from 'lucide-react';
import { plural } from '../engine/dates';
import {
  CALENDAR_MONTHS as MONTHS,
  CALENDAR_SEASONS,
  MonthSector,
  SeasonIcon,
  YearRing,
} from './CalendarModel';
import { YearBuildGame } from './YearBuildGame';

const SEASONS = CALENDAR_SEASONS.map((item) => ({
  name: item.name,
  months: item.months,
  className: item.id,
}));
const STEP_TITLES = ['Собери год', 'Год за годом', 'Годы и ещё месяцы'];

function YearGroup({ index }: { index: number }) {
  return (
    <div className="year-group-card" aria-label={`${index}-й год: 12 месяцев`}>
      <div className="year-group-ring" aria-hidden="true">
        <YearRing label={`${index}-й год: 12 месяцев`} />
        <strong>12</strong>
        <small>мес.</small>
      </div>
      <span>{index}-й год</span>
    </div>
  );
}

/** A self-paced explanation, not an additional unapproved quiz. */
export function YearMonthsPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [filled, setFilled] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [years, setYears] = useState(1);
  const [extra, setExtra] = useState(0);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const referenceId = useId();
  const statusId = useId();
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const month = selectedMonth === null ? null : MONTHS[selectedMonth];
  const season = month ? SEASONS.find((item) => item.className === month.season) : null;
  const monthWord = plural(filled, ['месяц', 'месяца', 'месяцев']);
  const addition = Array.from({ length: years }, () => '12').join(' + ');
  const extraAddition = Array.from({ length: extra }, () => '1').join(' + ');
  const yearsTotal = years * 12;
  const mixedTotal = 24 + extra;
  const totalWord = (value: number) => plural(value, ['месяц', 'месяца', 'месяцев']);

  if (gameOpen) return <YearBuildGame onExit={() => setGameOpen(false)} />;

  return (
    <div className="year-month-pilot year-month-pilot-v2">
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
            aria-label="Времена года"
            title="Времена года"
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
            'Нажимай «+ месяц», чтобы заполнить год. Можно нажать месяц на круге.',
            'Добавляй и убирай годы. Посмотри, как меняется число месяцев.',
            'Добавляй и убирай отдельные месяцы. Посмотри, как меняется сумма.',
          ][step]
        }
      </CardGuide>

      <div
        id={referenceId}
        className="pilot-season-reference"
        aria-label="Времена года"
        hidden={!referenceOpen}
      >
        <p>В каждом времени года — 3 месяца.</p>
        {SEASONS.map((item) => (
          <div key={item.name} className={`season-reference-row season-${item.className}`}>
            <strong>
              <SeasonIcon season={item.className} size={16} /> {item.name}
            </strong>
            <span>{item.months}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <section aria-label="Собери год из месяцев">
          <p className="pilot-instruction sr-only">Нажимай «+ месяц» — заполняй круг.</p>
          <div className="year-build-layout">
            <div
              className="year-clock"
              role="group"
              aria-label="Круг года: 12 месяцев"
              aria-describedby={statusId}
            >
              <YearRing filled={filled} label={`Круг года. Закрашено ${filled} из 12 месяцев.`} />
              <div className="year-clock-center" aria-hidden="true">
                <strong>{filled}</strong>
                <span>{monthWord}</span>
              </div>
              {MONTHS.map((item, index) => {
                const angle = ((index * 30 - 75) * Math.PI) / 180;
                return (
                  <button
                    key={item.full}
                    type="button"
                    className={`year-clock-month season-${item.season} ${index < filled ? 'is-filled' : ''}`}
                    style={{
                      left: `${50 + 35.5 * Math.cos(angle)}%`,
                      top: `${50 + 35.5 * Math.sin(angle)}%`,
                    }}
                    aria-label={`${item.short} — ${item.full}, ${index + 1}-й месяц года`}
                    aria-pressed={selectedMonth === index}
                    onClick={() => setSelectedMonth(index)}
                  >
                    {item.short}
                  </button>
                );
              })}
            </div>
            <div className="year-build-controls">
              <button
                type="button"
                className="button tool-add year-add-button"
                aria-label={filled === 12 ? 'Пройти ещё раз' : '+ месяц'}
                onClick={() => {
                  if (filled === 12) {
                    setFilled(0);
                    setSelectedMonth(null);
                  } else {
                    setFilled(filled + 1);
                    setSelectedMonth(filled);
                  }
                }}
              >
                {filled === 12 ? (
                  <RotateCcw size={20} aria-hidden="true" />
                ) : (
                  <Plus size={20} aria-hidden="true" />
                )}
                {filled === 12 ? 'Пройти ещё раз' : 'месяц'}
              </button>
              <p id={statusId} className="year-build-status" role="status">
                {filled === 12 ? (
                  <>
                    <strong>1 год = 12 месяцев.</strong>
                  </>
                ) : month && season ? (
                  <>
                    <strong>{month.full}</strong> — {selectedMonth! + 1}-й месяц. {season.name}.
                  </>
                ) : filled === 0 ? (
                  'Начни с января.'
                ) : (
                  <>
                    <strong>
                      {filled} {monthWord}
                    </strong>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="model-tools year-game-tools" role="group" aria-label="Инструменты модели">
            <button
              type="button"
              className="button tool-outline year-game-entry"
              aria-label="Играть — игра «Собери год»"
              onClick={() => setGameOpen(true)}
            >
              <Puzzle size={18} aria-hidden="true" /> Играть
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Несколько лет — несколько групп по двенадцать">
          <p className="pilot-instruction sr-only">1 год — 12 месяцев. Добавляй годы.</p>
          <div className="year-groups" aria-live="polite">
            {Array.from({ length: years }, (_, index) => (
              <YearGroup key={index} index={index + 1} />
            ))}
          </div>
          <div className="pilot-formula" aria-live="polite">
            <span>{addition}</span>
            <span>= {years} × 12</span>
            <strong className="pilot-formula-result">
              = {yearsTotal} {totalWord(yearsTotal)}
            </strong>
          </div>
          <div
            className="pilot-model-controls model-tools"
            role="group"
            aria-label="Инструменты модели"
          >
            <button
              type="button"
              className="button tool-remove"
              disabled={years === 1}
              onClick={() => setYears((value) => Math.max(1, value - 1))}
            >
              <Minus size={18} aria-hidden="true" /> Убрать год
            </button>
            <button
              type="button"
              className="button tool-add"
              disabled={years === 3}
              aria-label={years === 3 ? 'В примере 3 года' : '+ год'}
              onClick={() => setYears((value) => Math.min(3, value + 1))}
            >
              {years < 3 && <Plus size={18} aria-hidden="true" />}
              {years === 3 ? 'В примере 3 года' : 'год'}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section aria-label="Целые годы и отдельные месяцы">
          <p className="pilot-instruction sr-only">Добавляй месяцы к целым годам.</p>
          <div className="year-groups year-groups-two">
            <YearGroup index={1} />
            <YearGroup index={2} />
          </div>
          <div className="extra-months" aria-live="polite">
            <strong>Ещё месяцы</strong>
            <div className="extra-month-tokens">
              {extra === 0 ? (
                <span className="extra-month-empty">0 месяцев</span>
              ) : (
                Array.from({ length: extra }, (_, index) => (
                  <span key={index} className="extra-month-token">
                    <MonthSector label="1 месяц" />
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="pilot-formula" aria-live="polite">
            <span>12 + 12{extraAddition ? ` + ${extraAddition}` : ''}</span>
            <span>= 2 × 12{extra ? ` + ${extra}` : ''}</span>
            <strong className="pilot-formula-result">
              = {mixedTotal} {totalWord(mixedTotal)}
            </strong>
          </div>
          <div
            className="pilot-model-controls model-tools"
            role="group"
            aria-label="Инструменты модели"
          >
            <button
              type="button"
              className="button tool-remove"
              disabled={extra === 0}
              aria-label="Убрать отдельный месяц"
              onClick={() => setExtra((value) => Math.max(0, value - 1))}
            >
              <Minus size={18} aria-hidden="true" /> Убрать
            </button>
            <button
              type="button"
              className="button tool-add"
              disabled={extra === 2}
              aria-label={extra === 2 ? 'В примере 2 месяца' : '+ месяц'}
              onClick={() => setExtra((value) => Math.min(2, value + 1))}
            >
              {extra < 2 && <Plus size={18} aria-hidden="true" />}
              {extra === 2 ? 'В примере 2 месяца' : 'месяц'}
            </button>
          </div>
        </section>
      )}

      <div className="pilot-actions">
        {step > 0 && (
          <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} /> Назад
          </button>
        )}
        {step < 2 ? (
          <button type="button" className="button primary" onClick={() => setStep(step + 1)}>
            Дальше <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" className="button primary" onClick={onPractice}>
            {practiceLabel} <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
