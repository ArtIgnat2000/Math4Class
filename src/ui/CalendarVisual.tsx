import { useState } from 'react';
import {
  CalendarModelLegend,
  MonthSector,
  SeasonIcon,
  SeasonSector,
  YearRing,
  YearToken,
  monthByName,
  quantityFromLabel,
  type CalendarSeason,
} from './CalendarModel';
type Season = CalendarSeason;
type Token = {
  label: string;
  kind: 'month' | 'year' | 'season' | 'week' | 'days' | 'interval';
  season?: Season;
};
const month = (label: string, season?: Season): Token => ({ label, kind: 'month', season });
const year = (label: string): Token => ({ label, kind: 'year' });
const days = (label: string): Token => ({ label, kind: 'days' });
const season = (label: string, image: Season): Token => ({ label, kind: 'season', season: image });
const week = (label: string): Token => ({ label, kind: 'week' });
const interval = (label: string): Token => ({ label, kind: 'interval' });
const seasons: Season[] = ['winter', 'spring', 'summer', 'autumn'];
const yearMonthNames = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
];
// Days/weeks/intervals keep their own pictured units. Years, months and seasons
// use the shared circle/sector model so the same unit looks the same everywhere.
const monthArt: Record<string, string> = {
  янв: 'month-01.webp',
  фев: 'month-02.webp',
  мар: 'month-03.webp',
  апр: 'month-04.webp',
  май: 'month-05.webp',
  июн: 'month-06.webp',
  июл: 'month-07.webp',
  авг: 'month-08.webp',
  сен: 'month-09.webp',
  окт: 'month-10.webp',
  ноя: 'month-11.svg',
  дек: 'month-12.svg',
};
export function calendarArtFor(token: Token): string {
  if (token.kind === 'month') {
    const key = token.label.toLocaleLowerCase('ru').slice(0, 3);
    return monthArt[key] ?? 'page.webp'; // Roman numeral or unknown: no answer hint.
  }
  if (token.kind === 'season') return `${token.season}.webp`;
  return (
    { year: 'year.svg', week: 'week.svg', interval: 'interval.svg', days: 'days.svg' } as const
  )[token.kind];
}

// These are only the quantities and dates in each question, never a computed
// total or a highlighted correct option. An unasked count stays a question mark.
const scenes: Record<string, Record<string, Token[]>> = {
  'calendar-months': {
    'month-count': yearMonthNames.map((name) => month(name)),
    'roman-four': [month('IV')],
    'roman-nine': [month('IX')],
    'roman-twelve': [month('XII')],
    'october-number': [month('Октябрь'), days('№ ?')],
    'after-august': [month('Август', 'summer'), month('?')],
    'before-january': [month('?'), month('Январь', 'winter')],
  },
  'calendar-seasons': {
    winter: [season('Зима', 'winter')],
    spring: [season('Весна', 'spring')],
    summer: [season('Лето', 'summer')],
    autumn: [season('Осень', 'autumn')],
    'months-in-season': seasons.map((image) =>
      season(
        ({ winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' } as const)[image],
        image,
      ),
    ),
    'cross-year': [
      month('Декабрь', 'winter'),
      year('конец года'),
      year('начало года'),
      month('Январь', 'winter'),
    ],
    'two-seasons': [season('Весна', 'spring'), season('Лето', 'summer')],
  },
  'calendar-month-length': {
    april: [month('Апрель', 'spring'), days('? дней')],
    august: [month('Август', 'summer'), days('? дней')],
    'thirty-months': [year('Год'), days('30 дней'), days('? месяцев')],
    'thirty-one-months': [year('Год'), days('31 день'), days('? месяцев')],
    february: [month('Февраль', 'winter'), days('? дней')],
    'all-thirty': [month('Месяц?'), month('Месяц?'), month('Месяц?'), days('30 дней?')],
    'may-june': [month('Май', 'spring'), month('Июнь', 'summer'), days('вместе ?')],
    'july-september': [month('Июль', 'summer'), month('Сентябрь', 'autumn')],
  },
  'calendar-leap-year': {
    'ordinary-days': [year('Обычный год'), days('? суток')],
    'leap-days': [year('Високосный год'), days('? суток')],
    'february-2024': [year('2024'), month('Февраль', 'winter'), days('? дней')],
    'next-after-2024': [year('2024'), interval('→'), year('?')],
    'next-after-2028': [year('2028'), interval('→'), year('?')],
    'choose-leap': [year('2025'), year('2026'), year('2028')],
    'two-years': [year('2023'), year('2024'), days('вместе ?')],
    'february-2026': [year('2026'), month('Февраль', 'winter'), days('? дней')],
  },
  'calendar-years-months': {
    'four-years': [year('4 года'), month('в месяцах?')],
    'two-three': [year('2 года'), month('3 месяца'), month('в месяцах?')],
    'three-eight': [year('3 года'), month('8 месяцев'), month('в месяцах?')],
    'one-eleven': [year('1 год'), month('11 месяцев'), month('в месяцах?')],
    'fifty-months': [month('50 месяцев'), year('в годах и месяцах?')],
    sixty: [month('60 месяцев'), year('полных лет?')],
    'compare-years': [year('3 года'), month('35 месяцев')],
    'five-four': [year('5 лет'), month('4 месяца'), month('в месяцах?')],
  },
  'calendar-word-problems': {
    summer: [
      month('Июнь', 'summer'),
      month('Июль', 'summer'),
      month('Август', 'summer'),
      days('вместе ?'),
    ],
    rest: [
      month('Июнь', 'summer'),
      month('Июль', 'summer'),
      interval('2 смены по 10 дней'),
      week('1 неделя'),
    ],
    'april-may': [month('Апрель', 'spring'), month('Май', 'spring'), days('вместе ?')],
    'four-weeks': [week('1 неделя'), week('1 неделя'), week('1 неделя'), week('1 неделя')],
    'two-shifts': [interval('12 дней'), interval('12 дней'), week('1 неделя')],
    'july-rest': [
      month('Июль', 'summer'),
      days('31 день'),
      interval('18 дней на даче'),
      days('дома ?'),
    ],
    'feb-march-leap': [
      year('2024'),
      month('Февраль', 'winter'),
      month('Март', 'spring'),
      days('вместе ?'),
    ],
    'four-weeks-month': [week('4 недели'), month('1 месяц'), days('всегда равно?')],
  },
};

export function CalendarToken({ token }: { token: Token }) {
  if (token.kind === 'year') {
    const isQuestion = /[?]/.test(token.label) || /в годах|полных лет/i.test(token.label);
    return (
      <span className="calendar-token calendar-token-year">
        {isQuestion ? (
          <span className="calendar-question-chip">{token.label}</span>
        ) : (
          <YearToken label={token.label} />
        )}
      </span>
    );
  }
  if (token.kind === 'season' && token.season) {
    return (
      <span className="calendar-token calendar-token-season">
        <SeasonSector season={token.season} label={token.label} />
      </span>
    );
  }
  if (token.kind === 'month') {
    const count = quantityFromLabel(token.label, 'month');
    if (count !== null && count > 0) {
      return (
        <span className="calendar-token calendar-token-month calendar-token-month-count">
          <span className="calendar-month-sector-group" aria-hidden="true">
            {count <= 12 ? (
              Array.from({ length: count }, (_, index) => (
                <MonthSector key={index} label="" showLabel={false} />
              ))
            ) : (
              <MonthSector label="" showLabel={false} />
            )}
          </span>
          <strong>{token.label}</strong>
        </span>
      );
    }
    const isQuestion =
      /[?]/.test(token.label) || /в месяцах|в годах|полных лет|всегда равно/i.test(token.label);
    return (
      <span className="calendar-token calendar-token-month">
        {isQuestion ? (
          <span className="calendar-question-chip">{token.label}</span>
        ) : (
          <MonthSector
            label={token.label}
            season={token.season ?? monthByName(token.label)?.season}
          />
        )}
      </span>
    );
  }
  return (
    <span className={`calendar-token calendar-token-${token.kind}`}>
      <img
        src={`${import.meta.env.BASE_URL}illustrations/calendar/${calendarArtFor(token)}`}
        alt=""
        draggable={false}
      />
      <strong>{token.label}</strong>
    </span>
  );
}

export function CalendarVisual({ topicId, taskId }: { topicId: string; taskId: string }) {
  const tokens = scenes[topicId]?.[taskId];
  if (!tokens) return null;
  return (
    <figure
      className={`calendar-visual ${tokens.length === 12 ? 'calendar-year-strip' : ''}`}
      role="img"
      aria-label={tokens.map((token) => token.label).join(', ')}
    >
      {tokens.map((token, index) => (
        <CalendarToken token={token} key={`${token.label}-${index}`} />
      ))}
    </figure>
  );
}

const seasonMonths = [
  { name: 'Зима', image: 'winter', months: ['Декабрь', 'Январь', 'Февраль'] },
  { name: 'Весна', image: 'spring', months: ['Март', 'Апрель', 'Май'] },
  { name: 'Лето', image: 'summer', months: ['Июнь', 'Июль', 'Август'] },
  { name: 'Осень', image: 'autumn', months: ['Сентябрь', 'Октябрь', 'Ноябрь'] },
] as const;

export function CalendarIntro({
  onReferenceChange,
}: { onReferenceChange?: (open: boolean) => void } = {}) {
  const [referenceStep, setReferenceStep] = useState(-1);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const setReference = (step: number) => {
    setReferenceStep(step);
    setSelectedSeason(null);
    onReferenceChange?.(step >= 0);
  };
  const openSeason = (index: number) => {
    setSelectedSeason(index);
    setSelectedMonth(0);
    onReferenceChange?.(true);
  };
  const closeSeason = () => {
    setSelectedSeason(null);
    onReferenceChange?.(false);
  };
  return (
    <div className="calendar-intro">
      {selectedSeason !== null ? (
        <section
          className="season-detail"
          aria-label={`${seasonMonths[selectedSeason].name}: три месяца`}
        >
          <button type="button" className="calendar-reference-link" onClick={closeSeason}>
            ← К кругу года
          </button>
          <h3>{seasonMonths[selectedSeason].name}</h3>
          <p>Нажми месяц.</p>
          <div className={`season-detail-model season-${seasonMonths[selectedSeason].image}`}>
            <SeasonSector
              season={seasonMonths[selectedSeason].image}
              label={seasonMonths[selectedSeason].name}
            />
            <MonthSector
              label={seasonMonths[selectedSeason].months[selectedMonth]}
              season={seasonMonths[selectedSeason].image}
            />
          </div>
          <div
            className="season-detail-months"
            role="group"
            aria-label={`Месяцы: ${seasonMonths[selectedSeason].name}`}
          >
            {seasonMonths[selectedSeason].months.map((name, index) => (
              <button
                key={name}
                type="button"
                aria-pressed={selectedMonth === index}
                onClick={() => setSelectedMonth(index)}
              >
                <span>{index + 1}</span>
                <strong>{name}</strong>
              </button>
            ))}
          </div>
          <p className="season-detail-discovery" aria-live="polite">
            <strong>{seasonMonths[selectedSeason].months[selectedMonth]}</strong> —{' '}
            {selectedMonth + 1}-й месяц {['зимы', 'весны', 'лета', 'осени'][selectedSeason]}.
          </p>
          <button
            type="button"
            className="season-detail-next"
            onClick={() => openSeason((selectedSeason + 1) % seasonMonths.length)}
          >
            Дальше: {seasonMonths[(selectedSeason + 1) % seasonMonths.length].name} →
          </button>
        </section>
      ) : referenceStep < 0 ? (
        <>
          <p>Год — 12 месяцев. Четыре времени года идут по кругу.</p>
          <div
            className="season-cycle calendar-model-cycle"
            role="group"
            aria-label="Круг года: зима, весна, лето, осень, затем снова зима. Нажми на время года."
          >
            <YearRing label="Круг года: 12 месяцев и четыре времени года" centerLabel="год" />
            <div className="season-cycle-buttons">
              {seasonMonths.map(({ name, image }, index) => (
                <button
                  type="button"
                  key={name}
                  className={`season-cycle-choice season-cycle-${image} season-${image}`}
                  onClick={() => openSeason(index)}
                  aria-label={`Открыть: ${name}`}
                >
                  <SeasonIcon season={image} />
                  <strong>{name}</strong>
                </button>
              ))}
            </div>
          </div>
          <CalendarModelLegend />
          <button type="button" className="calendar-reference-link" onClick={() => setReference(0)}>
            Месяцы и римские цифры →
          </button>
        </>
      ) : (
        <div className="calendar-reference-page" aria-live="polite">
          <button
            type="button"
            className="calendar-reference-link"
            onClick={() => setReference(-1)}
          >
            ← К кругу года
          </button>
          {referenceStep === 0 ? (
            <>
              <h3>Четыре времени года</h3>
              <p>В каждом времени года — 3 месяца.</p>
              <div className="calendar-season-months">
                {seasonMonths.map(({ name, image, months }) => (
                  <div key={name} className={`season-${image}`}>
                    <strong>
                      <SeasonIcon season={image} size={16} /> {name}
                    </strong>
                    <span>{months.join(' · ')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>{referenceStep === 1 ? 'От января до июня' : 'От июля до декабря'}</h3>
              <div
                className="roman-demo"
                aria-label={
                  referenceStep === 1
                    ? 'IV равно четырём: пять минус один'
                    : 'IX равно девяти: десять минус один'
                }
              >
                <span className="roman-demo-symbol">{referenceStep === 1 ? 'IV' : 'IX'}</span>
                <span className="roman-demo-equals">=</span>
                <span className="roman-demo-number">{referenceStep === 1 ? '4' : '9'}</span>
                <span className="roman-demo-caption">
                  {referenceStep === 1 ? 'I перед V: 5 − 1' : 'I перед X: 10 − 1'}
                </span>
                <span className="roman-demo-dots" aria-hidden="true">
                  {Array.from({ length: referenceStep === 1 ? 5 : 10 }, (_, index) => (
                    <span key={index} className={index === 0 ? 'roman-dot-removed' : ''} />
                  ))}
                </span>
              </div>
              <p className="roman-hint">
                {referenceStep === 1
                  ? 'I — 1, V — 5. Апрель — 4-й месяц.'
                  : 'X — 10. Дальше: октябрь, ноябрь, декабрь.'}
              </p>
              <div className="calendar-roman-grid" aria-label="Номера месяцев римскими цифрами">
                {[
                  ['I', 'Январь'],
                  ['II', 'Февраль'],
                  ['III', 'Март'],
                  ['IV', 'Апрель'],
                  ['V', 'Май'],
                  ['VI', 'Июнь'],
                  ['VII', 'Июль'],
                  ['VIII', 'Август'],
                  ['IX', 'Сентябрь'],
                  ['X', 'Октябрь'],
                  ['XI', 'Ноябрь'],
                  ['XII', 'Декабрь'],
                ]
                  .slice(referenceStep === 1 ? 0 : 6, referenceStep === 1 ? 6 : 12)
                  .map(([roman, name], index) => (
                    <div key={roman}>
                      <strong>{roman}</strong>
                      <span>{name}</span>
                      <small aria-label={`Номер ${index + (referenceStep === 1 ? 1 : 7)}`}>
                        {index + (referenceStep === 1 ? 1 : 7)}
                      </small>
                    </div>
                  ))}
              </div>
            </>
          )}
          <div className="calendar-reference-nav">
            {referenceStep > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setReference(referenceStep - 1)}
              >
                Назад
              </button>
            )}
            {referenceStep < 2 && (
              <button
                type="button"
                className="button primary"
                onClick={() => setReference(referenceStep + 1)}
              >
                Дальше
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarOrderToken({ topicId, label }: { topicId: string; label: string }) {
  if (topicId === 'calendar-seasons') {
    const images: Record<string, Season> = {
      Зима: 'winter',
      Весна: 'spring',
      Лето: 'summer',
      Осень: 'autumn',
    };
    return <CalendarToken token={season(label, images[label])} />;
  }
  return <CalendarToken token={month(label)} />;
}
