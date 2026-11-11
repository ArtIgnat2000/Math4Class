const timeUnits = [
  {
    key: 'century',
    unit: [{ label: 'Век', image: 'time-unit-century.webp' }],
    relation: '1 век = 100 лет',
  },
  {
    key: 'year',
    unit: [{ label: 'Год', image: 'time-unit-year.webp' }],
    relation: '1 год = 12 месяцев',
  },
  {
    key: 'month',
    unit: [{ label: 'Месяц', image: 'time-unit-month.webp' }],
    relation: '30 или 31 сутки',
  },
  {
    key: 'day',
    unit: [{ label: 'Сутки', image: 'time-unit-day.webp' }],
    relation: '1 сутки = 24 часа',
  },
  {
    key: 'hour',
    unit: [{ label: 'Час', image: 'time-unit-hour.webp' }],
    relation: '1 час = 60 минут',
  },
  {
    key: 'minute-second',
    unit: [
      { label: 'Минута', image: 'time-unit-minute.webp' },
      { label: 'Секунда', image: 'time-unit-second.webp' },
    ],
    relation: '1 минута = 60 секунд',
  },
];

export function TimeUnitsTable() {
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
              <tr key={key}>
                <th scope="row">
                  <span className={`time-units-figures ${unit.length > 1 ? 'paired' : ''}`}>
                    {unit.map(({ label, image }) => (
                      <span className="time-units-figure" key={label}>
                        <img
                          src={`${import.meta.env.BASE_URL}illustrations/${image}`}
                          alt=""
                          width="1254"
                          height="1254"
                          decoding="async"
                        />
                        <span>{label}</span>
                      </span>
                    ))}
                  </span>
                </th>
                <td>{relation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
