import { Fragment, useState } from 'react';

const timeUnits = [
  {
    key: 'century',
    unit: [
      {
        key: 'century',
        label: 'Век',
        image: 'time-unit-century.webp',
        detail: 'Век — это 100 лет. Так называют большой отрезок времени.',
      },
    ],
    relation: '1 век = 100 лет',
  },
  {
    key: 'year',
    unit: [
      {
        key: 'year',
        label: 'Год',
        image: 'time-unit-year.webp',
        detail: 'В году 12 месяцев. Обычно в нём 365 суток, а в високосном году — 366.',
      },
    ],
    relation: '1 год = 12 месяцев',
  },
  {
    key: 'month',
    unit: [
      {
        key: 'month',
        label: 'Месяц',
        image: 'time-unit-month.webp',
        detail:
          'В большинстве месяцев 30 или 31 сутки. В феврале 28 суток, а в високосном году — 29.',
      },
    ],
    relation: '30 или 31 сутки',
  },
  {
    key: 'day',
    unit: [
      {
        key: 'day',
        label: 'Сутки',
        image: 'time-unit-day.webp',
        detail: 'Сутки — это день и ночь вместе. Они длятся 24 часа.',
      },
    ],
    relation: '1 сутки = 24 часа',
  },
  {
    key: 'hour',
    unit: [
      {
        key: 'hour',
        label: 'Час',
        image: 'time-unit-hour.webp',
        detail: 'В одном часе 60 минут. За это время минутная стрелка часов делает полный круг.',
      },
    ],
    relation: '1 час = 60 минут',
  },
  {
    key: 'minute-second',
    unit: [
      {
        key: 'minute',
        label: 'Минута',
        image: 'time-unit-minute.webp',
        detail: 'В одной минуте 60 секунд. Песочные часы помогают наблюдать, как проходит время.',
      },
      {
        key: 'second',
        label: 'Секунда',
        image: 'time-unit-second.webp',
        detail: 'Секундомер помогает отмерять секунды — короткие промежутки времени.',
      },
    ],
    relation: '1 минута = 60 секунд',
  },
];

export function TimeUnitsTable() {
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  return (
    <section className="time-units-card">
      <div className="time-units-table-wrap">
        <table className="time-units-table">
          <caption className="sr-only">Соотношения между единицами времени</caption>
          <colgroup>
            <col className="time-units-unit-column" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Единица</th>
              <th scope="col">Соотношение</th>
            </tr>
          </thead>
          <tbody>
            {timeUnits.map(({ key, unit, relation }) => (
              <Fragment key={key}>
                <tr>
                  <th scope="row">
                    <span className={`time-units-figures ${unit.length > 1 ? 'paired' : ''}`}>
                      {unit.map(({ key: unitKey, label, image }) => {
                        const expanded = expandedUnit === unitKey;
                        const detailId = `time-unit-detail-${unitKey}`;
                        return (
                          <button
                            type="button"
                            className="time-units-figure"
                            key={unitKey}
                            aria-label={`${expanded ? 'Скрыть' : 'Показать'} пояснение: ${label}`}
                            aria-expanded={expanded}
                            aria-controls={detailId}
                            onClick={() => setExpandedUnit(expanded ? null : unitKey)}
                          >
                            <img
                              src={`${import.meta.env.BASE_URL}illustrations/${image}`}
                              alt=""
                              width="1254"
                              height="1254"
                              decoding="async"
                            />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </span>
                  </th>
                  <td>{relation}</td>
                </tr>
                {unit.map(({ key: unitKey, label, image, detail }) => (
                  <tr
                    className="time-units-detail-row"
                    id={`time-unit-detail-${unitKey}`}
                    key={unitKey}
                    hidden={expandedUnit !== unitKey}
                  >
                    <td colSpan={2}>
                      <div className="time-units-detail">
                        <img
                          src={`${import.meta.env.BASE_URL}illustrations/${image}`}
                          alt=""
                          width="1254"
                          height="1254"
                          decoding="async"
                        />
                        <div>
                          <strong>{label}</strong>
                          <p>{detail}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
