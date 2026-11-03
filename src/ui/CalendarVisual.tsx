type Season = 'winter' | 'spring' | 'summer' | 'autumn';
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
// A month has the same recognizable subject wherever it appears, while the
// whole pictured question changes with its dates, intervals and unknowns.
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

export function CalendarIntro() {
  return (
    <div className="calendar-intro">
      <p>Год идёт по кругу: меняются месяцы и времена года.</p>
      <div className="calendar-intro-seasons" role="img" aria-label="Зима, весна, лето и осень">
        {seasons.map((image) => (
          <CalendarToken
            token={season(
              ({ winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' } as const)[
                image
              ],
              image,
            )}
            key={image}
          />
        ))}
      </div>
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
